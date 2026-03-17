import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Select, Card, Badge, SectionHeader } from '../components/ui';
import { classifyProduct } from '../services/classify-client';
import { useAppStore } from '../store';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { formatPercent, formatHtsCode } from '../utils/format';
import { COUNTRIES } from '../utils/constants';
import type { ClassificationResult } from '../types';

const countryOptions = COUNTRIES.map((c) => ({ label: `${c.name} (${c.code})`, value: c.code }));

export function ClassifyScreen() {
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('CN');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState('');
  const addClassification = useAppStore((s) => s.addClassification);

  const handleClassify = useCallback(async () => {
    if (!description.trim()) return;
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const classification = await classifyProduct(description.trim(), country);
      setResult(classification);
      addClassification(classification);
    } catch (err) {
      setError('Classification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [description, country, addClassification]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>HTS Classification</Text>
        <Text style={styles.subtitle}>
          Describe your product to find the correct HTS code
        </Text>

        {/* Input Form */}
        <Card style={styles.formCard}>
          <Input
            label="Product Description"
            placeholder="e.g., Men's cotton hooded sweatshirt, 80% cotton 20% polyester"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Select
            label="Country of Origin"
            options={countryOptions}
            value={country}
            onValueChange={setCountry}
          />
          <Button
            title="Classify Product"
            onPress={handleClassify}
            loading={isLoading}
            disabled={!description.trim()}
            style={styles.classifyButton}
          />
        </Card>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        {/* Results */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.loadingText}>Searching USITC database...</Text>
          </View>
        )}

        {result && (
          <View style={styles.results}>
            <SectionHeader title="Primary Classification" />
            <Card variant="elevated" style={styles.primaryCard}>
              <View style={styles.codeRow}>
                <Text style={styles.htsCode}>{formatHtsCode(result.primary.code)}</Text>
                <Badge
                  label={`${result.primary.confidence}% match`}
                  variant={result.primary.confidence >= 70 ? 'success' : 'warning'}
                  size="md"
                />
              </View>
              <Text style={styles.htsDescription}>{result.primary.description}</Text>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>General Duty Rate</Text>
                <Text style={styles.rateValue}>{result.primary.generalRate}</Text>
              </View>
            </Card>

            {/* Special Tariffs */}
            {result.specialTariffs.length > 0 && (
              <>
                <SectionHeader title="Special Tariffs" />
                {result.specialTariffs.map((tariff, i) => (
                  <Card key={i} style={styles.tariffCard}>
                    <View style={styles.tariffHeader}>
                      <Badge label={tariff.rate} variant="danger" size="md" />
                      <Text style={styles.tariffName}>{tariff.name}</Text>
                    </View>
                    <Text style={styles.tariffMeta}>
                      {tariff.authority} &middot; {tariff.htsProvision}
                    </Text>
                  </Card>
                ))}
              </>
            )}

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <>
                <SectionHeader title="Alternative Classifications" />
                {result.alternatives.map((alt, i) => (
                  <Card key={i} style={styles.altCard}>
                    <View style={styles.altHeader}>
                      <Text style={styles.altCode}>{formatHtsCode(alt.code)}</Text>
                      <Badge label={`${alt.confidence}%`} variant="default" />
                    </View>
                    <Text style={styles.altDescription} numberOfLines={2}>
                      {alt.description}
                    </Text>
                    <Text style={styles.altRate}>Rate: {alt.generalRate}</Text>
                  </Card>
                ))}
              </>
            )}

            {/* Reasoning */}
            {result.reasoning.length > 0 && (
              <>
                <SectionHeader title="Classification Reasoning" />
                <Card>
                  {result.reasoning.map((step, i) => (
                    <Text key={i} style={styles.reasoningStep}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                </Card>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.neutral[500], marginBottom: spacing.xl },
  formCard: { gap: spacing.lg, marginBottom: spacing.lg },
  classifyButton: { marginTop: spacing.sm },
  errorCard: { backgroundColor: colors.danger[50], borderColor: colors.danger[200] },
  errorText: { ...typography.body, color: colors.danger[700] },
  loadingContainer: { alignItems: 'center', padding: spacing['3xl'] },
  loadingText: { ...typography.body, color: colors.neutral[500], marginTop: spacing.md },
  results: { marginTop: spacing.lg },
  primaryCard: { marginBottom: spacing.xl },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  htsCode: { ...typography.h2, color: colors.primary[700] },
  htsDescription: { ...typography.body, color: colors.neutral[700], marginBottom: spacing.md, lineHeight: 22 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  rateLabel: { ...typography.bodyMedium, color: colors.neutral[600] },
  rateValue: { ...typography.h3, color: colors.neutral[900] },
  tariffCard: { marginBottom: spacing.sm },
  tariffHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  tariffName: { ...typography.bodyMedium, color: colors.neutral[800], flex: 1 },
  tariffMeta: { ...typography.caption, color: colors.neutral[500] },
  altCard: { marginBottom: spacing.sm },
  altHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  altCode: { ...typography.bodyMedium, color: colors.primary[600] },
  altDescription: { ...typography.body, color: colors.neutral[600], marginBottom: spacing.xs },
  altRate: { ...typography.caption, color: colors.neutral[500] },
  reasoningStep: { ...typography.body, color: colors.neutral[600], marginBottom: spacing.sm, lineHeight: 22 },
});
