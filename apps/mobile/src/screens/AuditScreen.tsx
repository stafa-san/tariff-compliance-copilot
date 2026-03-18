import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Card, Button, Badge } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatCurrency } from '../utils/format';
import type { AuditFinding } from '../types';
import type { RootStackScreenProps } from '../navigation/types';

interface DocFile {
  name: string;
  uri: string;
  size?: number;
}

interface DutyResult {
  enteredValue: number;
  generalDuty: number;
  section122Duty: number;
  section301Duty: number;
  section232Duty: number;
  mpf: number;
  hmf: number;
  totalDuties: number;
  effectiveRate: number;
  landedCost: number;
}

interface RiskResult {
  score: number;
  level: 'Low' | 'Medium' | 'High';
  totalChecks: number;
  errors: number;
  warnings: number;
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export function AuditScreen({ navigation }: RootStackScreenProps<'Audit'>) {
  const [invoice, setInvoice] = useState<DocFile | null>(null);
  const [form7501, setForm7501] = useState<DocFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [dutyResult, setDutyResult] = useState<DutyResult | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [agentSummary, setAgentSummary] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const pickDocument = async (type: 'invoice' | 'form7501') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const doc: DocFile = {
          name: asset.name,
          uri: asset.uri,
          size: asset.size ?? undefined,
        };
        if (type === 'invoice') setInvoice(doc);
        else setForm7501(doc);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // Step 1: Extract text from PDF via API
  const extractPdfText = async (file: DocFile): Promise<string> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: 'application/pdf',
    } as any);

    const response = await fetch(`${API_BASE}/api/extract-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`PDF extraction failed: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  };

  // Step 2: Run audit via API (non-streaming for mobile)
  const runAudit = async () => {
    if (!invoice || !form7501) return;

    setIsAnalyzing(true);
    setStep('analyzing');
    setError('');
    setFindings([]);
    setDutyResult(null);
    setRiskResult(null);
    setAgentSummary('');

    try {
      // Extract text from both PDFs
      setAnalysisStep('Extracting invoice data...');
      const invoiceText = await extractPdfText(invoice);

      setAnalysisStep('Extracting Form 7501 data...');
      const form7501Text = await extractPdfText(form7501);

      // Build the audit prompt (same as web app)
      const auditMessage = `Please perform a comprehensive compliance audit on these two documents:

## Commercial Invoice
File: ${invoice.name}

${invoiceText}

---

## CBP Form 7501 (Entry Summary)
File: ${form7501.name}

${form7501Text}

---

Instructions:
1. Extract HTS codes, entered values, quantities, duty rates, and country of origin from both documents
2. Validate HTS codes using the lookup tool
3. Check for applicable trade remedies (Section 122/301/232) based on the country of origin
4. Calculate expected duties including MPF and HMF
5. Cross-check EVERY field between the two documents for discrepancies
6. Report your findings grouped by category and calculate an overall risk score`;

      // Send to audit API
      setAnalysisStep('Running AI compliance analysis...');
      const response = await fetch(`${API_BASE}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: auditMessage,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Audit API failed' }));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      // Parse the streaming response
      setAnalysisStep('Processing results...');
      const responseText = await response.text();
      const parsedFindings = parseStreamResponse(responseText);

      setFindings(parsedFindings.findings);
      setDutyResult(parsedFindings.dutyResult);
      setRiskResult(parsedFindings.riskResult);
      setAgentSummary(parsedFindings.summary);
      setStep('results');
    } catch (err: any) {
      console.error('Audit error:', err);
      setError(err.message || 'Failed to run audit. Check your connection and try again.');
      setStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Parse the Vercel AI SDK stream response
  const parseStreamResponse = (rawText: string) => {
    const findings: AuditFinding[] = [];
    let dutyResult: DutyResult | null = null;
    let riskResult: RiskResult | null = null;
    let summary = '';

    try {
      // The stream format has lines like: 0:"text"\n or a]:{...}\n
      const lines = rawText.split('\n').filter(Boolean);

      for (const line of lines) {
        // Tool call results contain our findings
        if (line.includes('report_finding') || line.includes('"field"')) {
          try {
            // Extract JSON from the line
            const jsonMatch = line.match(/\{[^{}]*"field"[^{}]*\}/g);
            if (jsonMatch) {
              for (const match of jsonMatch) {
                const parsed = JSON.parse(match);
                if (parsed.field && parsed.severity) {
                  findings.push({
                    field: parsed.field,
                    severity: parsed.severity,
                    title: parsed.title || parsed.field,
                    description: parsed.description || '',
                    declaredValue: parsed.invoiceValue || parsed.declaredValue,
                    expectedValue: parsed.form7501Value || parsed.expectedValue,
                    recommendation: parsed.recommendation || '',
                  });
                }
              }
            }
          } catch { /* skip unparseable lines */ }
        }

        // Extract duty calculation
        if (line.includes('calculate_expected_duties') || line.includes('"totalDuties"')) {
          try {
            const jsonMatch = line.match(/\{[^{}]*"totalDuties"[^{}]*\}/);
            if (jsonMatch) {
              dutyResult = JSON.parse(jsonMatch[0]);
            }
          } catch { /* skip */ }
        }

        // Extract risk score
        if (line.includes('calculate_risk_score') || line.includes('"score"')) {
          try {
            const jsonMatch = line.match(/\{[^{}]*"score"[^{}]*"level"[^{}]*\}/);
            if (jsonMatch) {
              riskResult = JSON.parse(jsonMatch[0]);
            }
          } catch { /* skip */ }
        }

        // Extract text content for summary
        if (line.startsWith('0:"')) {
          try {
            const text = JSON.parse(line.substring(2));
            if (typeof text === 'string') {
              summary += text;
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      console.error('Stream parse error:', e);
    }

    // Compute risk if not found
    if (!riskResult && findings.length > 0) {
      const errors = findings.filter((f) => f.severity === 'error').length;
      const warnings = findings.filter((f) => f.severity === 'warning').length;
      const score = Math.min(100, errors * 25 + warnings * 10);
      riskResult = {
        score,
        level: score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low',
        totalChecks: findings.length,
        errors,
        warnings,
      };
    }

    return { findings, dutyResult, riskResult, summary };
  };

  const exportCSV = async () => {
    if (findings.length === 0) return;

    const headers = 'Field,Severity,Title,Description,Recommendation\n';
    const rows = findings
      .map((f) =>
        [f.field, f.severity, f.title, `"${f.description.replace(/"/g, '""')}"`, `"${f.recommendation.replace(/"/g, '""')}"`].join(',')
      )
      .join('\n');

    const dutyRows = dutyResult
      ? `\n\nDuty Breakdown\nGeneral Duty,${dutyResult.generalDuty}\nSection 122,${dutyResult.section122Duty}\nSection 301,${dutyResult.section301Duty}\nSection 232,${dutyResult.section232Duty}\nMPF,${dutyResult.mpf}\nHMF,${dutyResult.hmf}\nTotal Duties,${dutyResult.totalDuties}\nLanded Cost,${dutyResult.landedCost}`
      : '';

    const riskRow = riskResult
      ? `\n\nRisk Assessment\nScore,${riskResult.score}\nLevel,${riskResult.level}\nErrors,${riskResult.errors}\nWarnings,${riskResult.warnings}`
      : '';

    const csv = headers + rows + dutyRows + riskRow;

    const fileUri = `${FileSystem.cacheDirectory}compliance_audit_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csv);

    await Share.share({
      url: fileUri,
      title: 'Compliance Audit Report',
    });
  };

  const resetAudit = () => {
    setInvoice(null);
    setForm7501(null);
    setStep('upload');
    setFindings([]);
    setDutyResult(null);
    setRiskResult(null);
    setAgentSummary('');
    setError('');
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'error':
        return { icon: 'close-circle' as const, color: colors.danger[600], bg: colors.danger[50], label: 'Discrepancy', variant: 'danger' as const };
      case 'warning':
        return { icon: 'alert-circle' as const, color: colors.warning[600], bg: colors.warning[50], label: 'Needs Review', variant: 'warning' as const };
      default:
        return { icon: 'checkmark-circle' as const, color: colors.success[600], bg: colors.success[50], label: 'Verified', variant: 'success' as const };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[900]} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>AI Compliance Audit</Text>
            <Text style={styles.subtitle}>Upload documents for automated review</Text>
          </View>
        </View>

        {step === 'upload' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={styles.sectionLabel}>Required Documents</Text>

            <TouchableOpacity
              style={[styles.uploadCard, shadows.sm, invoice && styles.uploadCardDone]}
              onPress={() => pickDocument('invoice')}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIcon, { backgroundColor: invoice ? colors.success[50] : colors.primary[50] }]}>
                <Ionicons
                  name={invoice ? 'checkmark-circle' : 'document-attach-outline'}
                  size={28}
                  color={invoice ? colors.success[600] : colors.primary[600]}
                />
              </View>
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>Commercial Invoice</Text>
                <Text style={styles.uploadSubtitle}>
                  {invoice ? invoice.name : 'Tap to select PDF'}
                </Text>
              </View>
              {invoice ? (
                <TouchableOpacity onPress={() => setInvoice(null)}>
                  <Ionicons name="close-circle" size={22} color={colors.neutral[400]} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadCard, shadows.sm, form7501 && styles.uploadCardDone]}
              onPress={() => pickDocument('form7501')}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIcon, { backgroundColor: form7501 ? colors.success[50] : colors.accent[50] }]}>
                <Ionicons
                  name={form7501 ? 'checkmark-circle' : 'document-text-outline'}
                  size={28}
                  color={form7501 ? colors.success[600] : colors.accent[600]}
                />
              </View>
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>CBP Form 7501</Text>
                <Text style={styles.uploadSubtitle}>
                  {form7501 ? form7501.name : 'Tap to select PDF'}
                </Text>
              </View>
              {form7501 ? (
                <TouchableOpacity onPress={() => setForm7501(null)}>
                  <Ionicons name="close-circle" size={22} color={colors.neutral[400]} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              )}
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger[600]} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Run Compliance Audit"
              onPress={runAudit}
              disabled={!invoice || !form7501}
              style={styles.runButton}
            />

            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={colors.primary[600]} />
                <Text style={styles.infoTitle}>How it works</Text>
              </View>
              <Text style={styles.infoText}>
                Our AI agent extracts data from your PDFs, validates HTS codes against the USITC database, checks applicable trade remedies (Section 122/301/232), calculates expected duties, and cross-references both documents for discrepancies.
              </Text>
            </Card>
          </Animated.View>
        )}

        {step === 'analyzing' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.analyzingTitle}>Analyzing Documents</Text>
            <Text style={styles.analyzingText}>{analysisStep}</Text>

            <View style={styles.stepsList}>
              <AnalysisStep icon="document-outline" label="Extract document data" active={analysisStep.includes('Extract')} />
              <AnalysisStep icon="code-outline" label="Validate HTS codes" active={analysisStep.includes('AI')} />
              <AnalysisStep icon="shield-checkmark-outline" label="Check trade remedies" active={analysisStep.includes('AI')} />
              <AnalysisStep icon="calculator-outline" label="Calculate expected duties" active={analysisStep.includes('Process')} />
              <AnalysisStep icon="document-text-outline" label="Generate findings report" active={analysisStep.includes('Process')} />
            </View>
          </Animated.View>
        )}

        {step === 'results' && (
          <Animated.View entering={FadeInDown.duration(400)}>
            {/* Risk Summary */}
            {riskResult && (
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, shadows.sm]}>
                  <Text style={styles.summaryLabel}>Checks</Text>
                  <Text style={styles.summaryValue}>{riskResult.totalChecks}</Text>
                </View>
                <View style={[styles.summaryCard, shadows.sm]}>
                  <Text style={styles.summaryLabel}>Errors</Text>
                  <Text style={[styles.summaryValue, { color: colors.danger[600] }]}>{riskResult.errors}</Text>
                </View>
                <View style={[styles.summaryCard, shadows.sm]}>
                  <Text style={styles.summaryLabel}>Warnings</Text>
                  <Text style={[styles.summaryValue, { color: colors.warning[600] }]}>{riskResult.warnings}</Text>
                </View>
                <View style={[styles.summaryCard, shadows.sm, {
                  backgroundColor: riskResult.level === 'High' ? colors.danger[50]
                    : riskResult.level === 'Medium' ? colors.warning[50] : colors.success[50],
                }]}>
                  <Text style={styles.summaryLabel}>Risk</Text>
                  <Text style={[styles.summaryValue, {
                    color: riskResult.level === 'High' ? colors.danger[600]
                      : riskResult.level === 'Medium' ? colors.warning[600] : colors.success[600],
                  }]}>{riskResult.score}</Text>
                </View>
              </View>
            )}

            {/* Duty Breakdown */}
            {dutyResult && (
              <Card variant="elevated" style={styles.dutyCard}>
                <Text style={styles.dutyTitle}>Duty Calculation</Text>
                {dutyResult.enteredValue > 0 && (
                  <>
                    <DutyRow label="Entered Value" value={dutyResult.enteredValue} />
                    <View style={styles.dutyDivider} />
                  </>
                )}
                <DutyRow label="General Duty" value={dutyResult.generalDuty} />
                {dutyResult.section122Duty > 0 && <DutyRow label="Section 122 (10%)" value={dutyResult.section122Duty} />}
                {dutyResult.section301Duty > 0 && <DutyRow label="Section 301 (25%)" value={dutyResult.section301Duty} />}
                {dutyResult.section232Duty > 0 && <DutyRow label="Section 232" value={dutyResult.section232Duty} />}
                <DutyRow label="MPF" value={dutyResult.mpf} />
                {dutyResult.hmf > 0 && <DutyRow label="HMF" value={dutyResult.hmf} />}
                <View style={styles.dutyDivider} />
                <View style={styles.dutyTotal}>
                  <Text style={styles.dutyTotalLabel}>Total Duties</Text>
                  <Text style={styles.dutyTotalValue}>{formatCurrency(dutyResult.totalDuties)}</Text>
                </View>
                {dutyResult.landedCost > 0 && (
                  <View style={styles.dutyTotal}>
                    <Text style={styles.dutyTotalLabel}>Landed Cost</Text>
                    <Text style={[styles.dutyTotalValue, { color: colors.neutral[900] }]}>
                      {formatCurrency(dutyResult.landedCost)}
                    </Text>
                  </View>
                )}
              </Card>
            )}

            {/* Findings */}
            <Text style={styles.findingsTitle}>Audit Findings ({findings.length})</Text>
            {findings.map((finding, i) => {
              const config = getSeverityConfig(finding.severity);
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <Card style={styles.findingCard}>
                    <View style={styles.findingHeader}>
                      <View style={[styles.findingIconBg, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={20} color={config.color} />
                      </View>
                      <View style={styles.findingMeta}>
                        <Text style={styles.findingField}>{finding.field}</Text>
                        <Badge label={config.label} variant={config.variant} />
                      </View>
                    </View>
                    <Text style={styles.findingTitle}>{finding.title}</Text>
                    <Text style={styles.findingDescription}>{finding.description}</Text>
                    {finding.declaredValue && finding.expectedValue && (
                      <View style={styles.valueCompare}>
                        <View style={styles.valueBox}>
                          <Text style={styles.valueLabel}>Invoice</Text>
                          <Text style={styles.valueText}>{finding.declaredValue}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={14} color={colors.neutral[400]} />
                        <View style={styles.valueBox}>
                          <Text style={styles.valueLabel}>Form 7501</Text>
                          <Text style={styles.valueText}>{finding.expectedValue}</Text>
                        </View>
                      </View>
                    )}
                    {finding.recommendation && finding.recommendation !== 'No action needed' && (
                      <View style={styles.findingRec}>
                        <Ionicons name="bulb-outline" size={14} color={colors.primary[600]} />
                        <Text style={styles.findingRecText}>{finding.recommendation}</Text>
                      </View>
                    )}
                  </Card>
                </Animated.View>
              );
            })}

            {/* Agent Summary */}
            {agentSummary ? (
              <Card style={styles.summaryCard2}>
                <View style={styles.infoRow}>
                  <Ionicons name="sparkles" size={18} color={colors.primary[600]} />
                  <Text style={styles.infoTitle}>AI Summary</Text>
                </View>
                <Text style={styles.summaryText}>{agentSummary}</Text>
              </Card>
            ) : null}

            {/* Actions */}
            <View style={styles.resultActions}>
              <Button title="Export CSV" onPress={exportCSV} style={styles.exportButton} />
              <Button title="New Audit" onPress={resetAudit} variant="outline" />
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AnalysisStep({ icon, label, active }: { icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean }) {
  return (
    <View style={analysisStyles.step}>
      {active ? (
        <ActivityIndicator size="small" color={colors.primary[600]} />
      ) : (
        <Ionicons name={icon} size={20} color={colors.neutral[300]} />
      )}
      <Text style={[analysisStyles.label, active && analysisStyles.labelActive]}>{label}</Text>
    </View>
  );
}

function DutyRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.dutyRow}>
      <Text style={styles.dutyLabel}>{label}</Text>
      <Text style={styles.dutyValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

const analysisStyles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  label: { ...typography.body, color: colors.neutral[400] },
  labelActive: { color: colors.primary[600] },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] },
  backButton: { padding: spacing.xs },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: 2 },
  subtitle: { ...typography.body, color: colors.neutral[500] },
  sectionLabel: { ...typography.label, color: colors.neutral[700], marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.md,
    gap: spacing.md, borderWidth: 1.5, borderColor: colors.neutral[200], borderStyle: 'dashed',
  },
  uploadCardDone: { borderColor: colors.success[300], borderStyle: 'solid' },
  uploadIcon: { width: 52, height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  uploadContent: { flex: 1 },
  uploadTitle: { ...typography.bodyMedium, color: colors.neutral[900], marginBottom: 2 },
  uploadSubtitle: { ...typography.caption, color: colors.neutral[500] },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.danger[50], borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { ...typography.body, color: colors.danger[700], flex: 1 },
  runButton: { marginTop: spacing.sm, marginBottom: spacing['2xl'] },
  infoCard: { backgroundColor: colors.primary[50] },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  infoTitle: { ...typography.bodyMedium, color: colors.primary[700] },
  infoText: { ...typography.caption, color: colors.primary[600], lineHeight: 20 },
  analyzingContainer: { alignItems: 'center', paddingTop: spacing['4xl'] },
  analyzingTitle: { ...typography.h3, color: colors.neutral[900], marginTop: spacing.xl },
  analyzingText: { ...typography.body, color: colors.neutral[500], marginBottom: spacing['2xl'], textAlign: 'center' },
  stepsList: { alignSelf: 'stretch', paddingHorizontal: spacing.xl },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  summaryCard: { width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center' },
  summaryLabel: { ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs },
  summaryValue: { ...typography.h2, color: colors.neutral[900] },
  dutyCard: { marginBottom: spacing.xl },
  dutyTitle: { ...typography.h3, color: colors.neutral[900], marginBottom: spacing.md },
  dutyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  dutyLabel: { ...typography.body, color: colors.neutral[600] },
  dutyValue: { ...typography.bodyMedium, color: colors.neutral[900] },
  dutyDivider: { height: 1, backgroundColor: colors.neutral[100], marginVertical: spacing.sm },
  dutyTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.xs },
  dutyTotalLabel: { ...typography.bodyMedium, color: colors.neutral[900] },
  dutyTotalValue: { ...typography.h3, color: colors.primary[700] },
  findingsTitle: { ...typography.h3, color: colors.neutral[900], marginBottom: spacing.md },
  findingCard: { marginBottom: spacing.sm },
  findingHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  findingIconBg: { width: 36, height: 36, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  findingMeta: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  findingField: { ...typography.bodyMedium, color: colors.neutral[900] },
  findingTitle: { ...typography.bodyMedium, color: colors.neutral[800], marginBottom: spacing.xs },
  findingDescription: { ...typography.caption, color: colors.neutral[600], lineHeight: 20, marginBottom: spacing.sm },
  valueCompare: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral[50], borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  valueBox: { flex: 1 },
  valueLabel: { ...typography.caption, color: colors.neutral[500], marginBottom: 2 },
  valueText: { ...typography.captionMedium, color: colors.neutral[800] },
  findingRec: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    backgroundColor: colors.primary[50], borderRadius: borderRadius.md, padding: spacing.sm,
  },
  findingRecText: { ...typography.caption, color: colors.primary[700], flex: 1 },
  summaryCard2: { marginBottom: spacing.xl },
  summaryText: { ...typography.body, color: colors.neutral[600], lineHeight: 22 },
  resultActions: { gap: spacing.md, marginBottom: spacing.lg },
  exportButton: { marginBottom: 0 },
});
