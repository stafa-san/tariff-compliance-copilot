import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Select, Card, SectionHeader } from '../components/ui';
import { searchHts, parseDutyRate } from '../services/hts-service';
import { useAppStore } from '../store';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatCurrency, formatPercent } from '../utils/format';
import { COUNTRIES, MPF_RATE, MPF_MIN, MPF_MAX, HMF_RATE } from '../utils/constants';
import type { DutyCalculation } from '../types';

const countryOptions = COUNTRIES.map((c) => ({ label: `${c.name} (${c.code})`, value: c.code }));
const shippingOptions = [
  { label: 'Ocean', value: 'ocean' },
  { label: 'Air', value: 'air' },
  { label: 'Truck', value: 'truck' },
  { label: 'Rail', value: 'rail' },
];

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found';

export function CalculatorScreen() {
  const [htsCode, setHtsCode] = useState('');
  const [htsDescription, setHtsDescription] = useState('');
  const [htsLookup, setHtsLookup] = useState<LookupStatus>('idle');
  const [dutyRateStr, setDutyRateStr] = useState('');
  const [enteredValue, setEnteredValue] = useState('');
  const [freight, setFreight] = useState('');
  const [insurance, setInsurance] = useState('');
  const [country, setCountry] = useState('CN');
  const [shippingMethod, setShippingMethod] = useState('ocean');
  const [result, setResult] = useState<DutyCalculation | null>(null);
  const addCalculation = useAppStore((s) => s.addCalculation);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── HTS Auto-Lookup ───
  const lookupHtsRate = useCallback(async (code: string) => {
    const clean = code.replace(/[\s.-]/g, '');
    if (clean.length < 4) {
      setHtsLookup('idle');
      setHtsDescription('');
      return;
    }

    setHtsLookup('loading');

    try {
      const heading = clean.slice(0, 4);
      const searchTerm = code.replace(/[\s]/g, '');
      const results = await searchHts(searchTerm.length > 10 ? heading : searchTerm);

      // Rate inheritance
      let inheritedGeneral = '';
      const enriched = results.map((r) => {
        if (r.general) inheritedGeneral = r.general;
        return { ...r, effectiveGeneral: r.general || inheritedGeneral };
      });

      // Find best match
      const findMatch = () => {
        // Exact match
        const exact = enriched.find((r) => {
          const fullCode = r.htsno.replace(/[\s.-]/g, '');
          return fullCode === clean;
        });
        if (exact) return exact;

        // 8-digit + stat suffix match
        if (clean.length >= 10) {
          const eightDigit = clean.slice(0, 8);
          const eightMatch = enriched.find((r) => r.htsno.replace(/[\s.-]/g, '') === eightDigit);
          if (eightMatch) return eightMatch;
        }

        // Partial prefix match
        return enriched
          .filter((r) => {
            const rc = r.htsno.replace(/[\s.-]/g, '');
            return clean.startsWith(rc) || rc.startsWith(clean);
          })
          .sort((a, b) => b.htsno.length - a.htsno.length)[0] || null;
      };

      const match = findMatch();

      if (match) {
        const rateStr = match.effectiveGeneral || '';
        const rate = parseDutyRate(rateStr);
        if (rateStr) {
          setDutyRateStr(rate !== null && rate > 0 ? rate.toString() : rateStr.toLowerCase() === 'free' ? '0' : '');
        }
        setHtsDescription(match.description);
        setHtsLookup('found');
      } else if (clean.length >= 8) {
        // Fallback: search by heading only
        const headingResults = await searchHts(heading);
        let hInheritedGeneral = '';
        const hEnriched = headingResults.map((r) => {
          if (r.general) hInheritedGeneral = r.general;
          return { ...r, effectiveGeneral: r.general || hInheritedGeneral };
        });
        const headingMatch = hEnriched
          .filter((r) => {
            const rc = r.htsno.replace(/[\s.-]/g, '');
            return clean.startsWith(rc) || rc.startsWith(clean.slice(0, 8));
          })
          .sort((a, b) => b.htsno.length - a.htsno.length)[0];

        if (headingMatch) {
          const rateStr = headingMatch.effectiveGeneral || '';
          const rate = parseDutyRate(rateStr);
          if (rateStr) {
            setDutyRateStr(rate !== null && rate > 0 ? rate.toString() : rateStr.toLowerCase() === 'free' ? '0' : '');
          }
          setHtsDescription(headingMatch.description);
          setHtsLookup('found');
        } else {
          setHtsLookup('not-found');
          setHtsDescription('');
        }
      } else {
        setHtsLookup('not-found');
        setHtsDescription('');
      }
    } catch {
      setHtsLookup('not-found');
      setHtsDescription('');
    }
  }, []);

  const handleHtsChange = (value: string) => {
    setHtsCode(value);
    setHtsLookup('idle');
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(() => {
      lookupHtsRate(value);
    }, 600);
  };

  // ─── Auto Tariff Rates ───
  const getApplicableRates = (countryCode: string, hts: string) => {
    const clean = hts.replace(/[\s.-]/g, '');
    const chapter = clean.slice(0, 2);

    // Section 122: 10% on ALL imports
    const s122 = 10;

    // Section 301: 25% on Chinese imports
    const s301 = countryCode === 'CN' ? 25 : 0;

    // Section 232: steel (Ch 72-73) = 25%, aluminum (Ch 76) = 10%
    let s232 = 0;
    if (['72', '73'].includes(chapter)) s232 = 25;
    else if (chapter === '76') s232 = 10;

    return { s122, s301, s232 };
  };

  // ─── Load Sample Data ───
  const loadSample = () => {
    setHtsCode('6110.20.2079');
    setEnteredValue('9000');
    setFreight('450');
    setInsurance('90');
    setCountry('CN');
    setShippingMethod('ocean');
    // Trigger auto-lookup
    setTimeout(() => lookupHtsRate('6110.20.2079'), 100);
  };

  // ─── Calculate ───
  const handleCalculate = useCallback(() => {
    const value = parseFloat(enteredValue);
    const generalRate = parseFloat(dutyRateStr) / 100 || 0;
    if (!value) return;

    const freightCost = parseFloat(freight) || 0;
    const insuranceCost = parseFloat(insurance) || 0;
    const ev = value + freightCost + insuranceCost;

    const { s122, s301, s232 } = getApplicableRates(country, htsCode);

    const generalDuty = ev * generalRate;
    const section122Duty = ev * (s122 / 100);
    const section301Duty = ev * (s301 / 100);
    const section232Duty = ev * (s232 / 100);
    const mpfRaw = ev * MPF_RATE;
    const mpf = Math.min(Math.max(mpfRaw, MPF_MIN), MPF_MAX);
    const hmf = shippingMethod === 'ocean' ? ev * HMF_RATE : 0;
    const totalDuties = generalDuty + section122Duty + section301Duty + section232Duty + mpf + hmf;
    const landedCost = ev + totalDuties;
    const effectiveRate = ev > 0 ? totalDuties / ev : 0;

    const calc: DutyCalculation = {
      htsCode: htsCode.trim(),
      htsDescription: htsDescription || 'N/A',
      enteredValue: ev,
      generalDutyRate: generalRate,
      generalDuty,
      section301Rate: s301 / 100,
      section301Duty,
      section232Rate: s232 / 100,
      section232Duty,
      section122Rate: s122 / 100,
      section122Duty,
      mpf,
      hmf,
      totalDuties,
      effectiveRate,
      landedCost,
      freight: freightCost,
      insurance: insuranceCost,
    };

    setResult(calc);
    addCalculation(calc);
  }, [htsCode, htsDescription, dutyRateStr, enteredValue, freight, insurance, country, shippingMethod, addCalculation, lookupHtsRate]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Duty Calculator</Text>
            <Text style={styles.subtitle}>Calculate total duties and landed cost</Text>
          </View>
          <Button title="Sample" onPress={loadSample} variant="outline" style={styles.sampleButton} />
        </View>

        <Card style={styles.formCard}>
          {/* HTS Code with auto-lookup */}
          <View>
            <Input
              label="HTS Code"
              placeholder="e.g., 6110.20.2079"
              value={htsCode}
              onChangeText={handleHtsChange}
              keyboardType="default"
            />
            {htsLookup === 'loading' && (
              <View style={styles.lookupStatus}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={styles.lookupText}>Looking up rate...</Text>
              </View>
            )}
            {htsLookup === 'found' && (
              <View style={styles.lookupStatus}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={[styles.lookupText, { color: colors.success[600] }]} numberOfLines={2}>
                  {htsDescription}
                </Text>
              </View>
            )}
            {htsLookup === 'not-found' && (
              <View style={styles.lookupStatus}>
                <Ionicons name="alert-circle" size={16} color={colors.warning[600]} />
                <Text style={[styles.lookupText, { color: colors.warning[600] }]}>
                  Code not found — enter rate manually
                </Text>
              </View>
            )}
          </View>

          <Input
            label={`General Duty Rate (%)${dutyRateStr && htsLookup === 'found' ? ' — auto-filled' : ''}`}
            placeholder="e.g., 16.5"
            value={dutyRateStr}
            onChangeText={setDutyRateStr}
            keyboardType="decimal-pad"
          />

          <Input
            label="Entered Value (USD)"
            placeholder="e.g., 9000"
            value={enteredValue}
            onChangeText={setEnteredValue}
            keyboardType="decimal-pad"
          />

          <View style={styles.row}>
            <Input
              label="Freight (USD)"
              placeholder="0"
              value={freight}
              onChangeText={setFreight}
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />
            <Input
              label="Insurance (USD)"
              placeholder="0"
              value={insurance}
              onChangeText={setInsurance}
              keyboardType="decimal-pad"
              containerStyle={styles.halfInput}
            />
          </View>

          <Select
            label="Country of Origin"
            options={countryOptions}
            value={country}
            onValueChange={setCountry}
          />
          <Select
            label="Shipping Method"
            options={shippingOptions}
            value={shippingMethod}
            onValueChange={setShippingMethod}
          />

          {/* Auto-applied tariffs preview */}
          {country && htsCode.length >= 4 && (
            <View style={styles.tariffPreview}>
              <Text style={styles.tariffPreviewTitle}>Auto-Applied Tariffs</Text>
              <TariffTag label="Section 122" rate="10%" always />
              {country === 'CN' && <TariffTag label="Section 301" rate="25%" />}
              {['72', '73'].includes(htsCode.replace(/[\s.-]/g, '').slice(0, 2)) && (
                <TariffTag label="Section 232 (Steel)" rate="25%" />
              )}
              {htsCode.replace(/[\s.-]/g, '').slice(0, 2) === '76' && (
                <TariffTag label="Section 232 (Aluminum)" rate="10%" />
              )}
              {shippingMethod === 'ocean' && <TariffTag label="HMF" rate="0.125%" />}
              <TariffTag label="MPF" rate="0.3464%" />
            </View>
          )}

          <Button
            title="Calculate Duties"
            onPress={handleCalculate}
            disabled={!enteredValue || (!dutyRateStr && htsLookup !== 'found')}
            style={styles.calcButton}
          />
        </Card>

        {/* Results */}
        {result && (
          <View style={styles.results}>
            <SectionHeader title="Duty Breakdown" />

            <Card variant="elevated" style={styles.resultCard}>
              {result.htsCode && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>HTS Code</Text>
                  <Text style={styles.resultValue}>{result.htsCode}</Text>
                </View>
              )}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Entered Value</Text>
                <Text style={styles.resultValue}>{formatCurrency(result.enteredValue)}</Text>
              </View>

              <View style={styles.divider} />

              <DutyRow label={`General Duty (${formatPercent(result.generalDutyRate)})`} value={result.generalDuty} />
              <DutyRow label={`Section 122 (${formatPercent(result.section122Rate)})`} value={result.section122Duty} />
              {result.section301Duty > 0 && (
                <DutyRow label={`Section 301 (${formatPercent(result.section301Rate)})`} value={result.section301Duty} />
              )}
              {result.section232Duty > 0 && (
                <DutyRow label={`Section 232 (${formatPercent(result.section232Rate)})`} value={result.section232Duty} />
              )}
              <DutyRow label="MPF (0.3464%)" value={result.mpf} />
              {result.hmf > 0 && <DutyRow label="HMF (0.125%)" value={result.hmf} />}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Duties</Text>
                <Text style={styles.totalValue}>{formatCurrency(result.totalDuties)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Effective Duty Rate</Text>
                <Text style={[styles.resultValue, { color: colors.accent[600] }]}>
                  {formatPercent(result.effectiveRate)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Landed Cost</Text>
                <Text style={styles.grandTotalValue}>{formatCurrency(result.landedCost)}</Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TariffTag({ label, rate, always }: { label: string; rate: string; always?: boolean }) {
  return (
    <View style={styles.tariffTag}>
      <Ionicons
        name={always ? 'flag' : 'alert-circle'}
        size={12}
        color={always ? colors.primary[600] : colors.warning[600]}
      />
      <Text style={styles.tariffTagText}>{label}: {rate}</Text>
    </View>
  );
}

function DutyRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.dutyLabel}>{label}</Text>
      <Text style={styles.dutyValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.neutral[500] },
  sampleButton: { paddingHorizontal: spacing.md, height: 36, minWidth: 80 },
  formCard: { gap: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  lookupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  lookupText: { ...typography.caption, color: colors.neutral[500], flex: 1 },
  tariffPreview: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tariffPreviewTitle: { ...typography.captionMedium, color: colors.neutral[700], marginBottom: spacing.xs },
  tariffTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tariffTagText: { ...typography.caption, color: colors.neutral[600] },
  calcButton: { marginTop: spacing.sm },
  results: { marginTop: spacing.md },
  resultCard: { marginBottom: spacing.xl },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resultLabel: { ...typography.body, color: colors.neutral[600] },
  resultValue: { ...typography.bodyMedium, color: colors.neutral[900] },
  dutyLabel: { ...typography.body, color: colors.neutral[500] },
  dutyValue: { ...typography.body, color: colors.neutral[700] },
  divider: { height: 1, backgroundColor: colors.neutral[100], marginVertical: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalLabel: { ...typography.bodyMedium, color: colors.neutral[800] },
  totalValue: { ...typography.h3, color: colors.primary[700] },
  grandTotalLabel: { ...typography.h3, color: colors.neutral[900] },
  grandTotalValue: { ...typography.h2, color: colors.primary[700] },
});
