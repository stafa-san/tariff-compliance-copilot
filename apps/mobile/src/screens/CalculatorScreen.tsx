import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Select, Card, SectionHeader } from '../components/ui';
import { calculateDuties } from '../services/duty-calculator';
import { parseDutyRate } from '../services/hts-service';
import { useAppStore } from '../store';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatCurrency, formatPercent, formatHtsCode } from '../utils/format';
import { COUNTRIES } from '../utils/constants';
import type { DutyCalculation } from '../types';

const countryOptions = COUNTRIES.map((c) => ({ label: `${c.name} (${c.code})`, value: c.code }));
const shippingOptions = [
  { label: 'Ocean', value: 'ocean' },
  { label: 'Air', value: 'air' },
  { label: 'Truck', value: 'truck' },
  { label: 'Rail', value: 'rail' },
];

export function CalculatorScreen() {
  const [htsCode, setHtsCode] = useState('');
  const [htsDescription, setHtsDescription] = useState('');
  const [dutyRateStr, setDutyRateStr] = useState('');
  const [enteredValue, setEnteredValue] = useState('');
  const [freight, setFreight] = useState('');
  const [insurance, setInsurance] = useState('');
  const [country, setCountry] = useState('CN');
  const [shippingMethod, setShippingMethod] = useState('ocean');
  const [result, setResult] = useState<DutyCalculation | null>(null);
  const addCalculation = useAppStore((s) => s.addCalculation);

  const handleCalculate = useCallback(() => {
    const value = parseFloat(enteredValue);
    const rate = parseDutyRate(dutyRateStr + '%');
    if (!value || rate === null) return;

    const calc = calculateDuties({
      htsCode: htsCode.trim(),
      htsDescription: htsDescription.trim() || 'N/A',
      enteredValue: value,
      generalDutyRate: rate / 100,
      countryOfOrigin: country,
      shippingMethod: shippingMethod as 'ocean' | 'air' | 'truck' | 'rail',
      freight: parseFloat(freight) || 0,
      insurance: parseFloat(insurance) || 0,
    });

    setResult(calc);
    addCalculation(calc);
  }, [htsCode, htsDescription, dutyRateStr, enteredValue, freight, insurance, country, shippingMethod, addCalculation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Duty Calculator</Text>
        <Text style={styles.subtitle}>Calculate total duties and landed cost</Text>

        <Card style={styles.formCard}>
          <Input
            label="HTS Code"
            placeholder="e.g., 6110.20.2079"
            value={htsCode}
            onChangeText={setHtsCode}
            keyboardType="default"
          />
          <Input
            label="Description"
            placeholder="Product description"
            value={htsDescription}
            onChangeText={setHtsDescription}
          />
          <Input
            label="General Duty Rate (%)"
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
          <Button
            title="Calculate Duties"
            onPress={handleCalculate}
            disabled={!enteredValue || !dutyRateStr}
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
                  <Text style={styles.resultValue}>{formatHtsCode(result.htsCode)}</Text>
                </View>
              )}
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Entered Value</Text>
                <Text style={styles.resultValue}>{formatCurrency(result.enteredValue)}</Text>
              </View>

              <View style={styles.divider} />

              <DutyRow label={`General Duty (${formatPercent(result.generalDutyRate)})`} value={result.generalDuty} />
              {result.section122Duty > 0 && (
                <DutyRow label={`Section 122 (${formatPercent(result.section122Rate)})`} value={result.section122Duty} />
              )}
              {result.section301Duty > 0 && (
                <DutyRow label={`Section 301 (${formatPercent(result.section301Rate)})`} value={result.section301Duty} />
              )}
              {result.section232Duty > 0 && (
                <DutyRow label={`Section 232 (${formatPercent(result.section232Rate)})`} value={result.section232Duty} />
              )}
              <DutyRow label="MPF" value={result.mpf} />
              {result.hmf > 0 && <DutyRow label="HMF" value={result.hmf} />}

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
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.neutral[500], marginBottom: spacing.xl },
  formCard: { gap: spacing.md, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
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
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.sm,
  },
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
