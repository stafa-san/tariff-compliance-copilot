import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';

interface ToolItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  screen: keyof import('../types').RootStackParamList | null;
  color: string;
}

const TOOLS: ToolItem[] = [
  {
    key: 'scenarios',
    title: 'Scenario Simulator',
    description: 'Compare sourcing countries and analyze tariff impact on landed costs',
    icon: '\u{1F30D}',
    screen: null,
    color: colors.primary[600],
  },
  {
    key: 'form7501',
    title: 'CBP Form 7501 Guide',
    description: 'Field-by-field reference for the Entry Summary form (47 fields)',
    icon: '\u{1F4CB}',
    screen: null,
    color: colors.accent[600],
  },
  {
    key: 'audit',
    title: 'AI Compliance Audit',
    description: 'Upload documents for automated compliance review and risk scoring',
    icon: '\u{1F50D}',
    screen: null,
    color: colors.success[600],
  },
  {
    key: 'reports',
    title: 'Compliance Reports',
    description: 'Generate and export classification, duty, and audit reports',
    icon: '\u{1F4CA}',
    screen: null,
    color: colors.warning[600],
  },
];

export function ToolsScreen({ navigation }: MainTabScreenProps<'Tools'>) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tools</Text>
        <Text style={styles.subtitle}>
          Advanced compliance tools and reference guides
        </Text>

        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.key}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to sub-screens when implemented
              // For now, tools expand inline or navigate to stack screens
            }}
          >
            <View style={[styles.toolCard, shadows.sm]}>
              <View style={[styles.iconContainer, { backgroundColor: tool.color + '15' }]}>
                <Text style={styles.toolIcon}>{tool.icon}</Text>
              </View>
              <View style={styles.toolContent}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </View>
              <Text style={styles.chevron}>{'\u203A'}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Trade Remedies Quick Reference */}
        <View style={styles.referenceSection}>
          <Text style={styles.referenceTitle}>Quick Reference</Text>

          <Card style={styles.referenceCard}>
            <Text style={styles.refHeader}>Current U.S. Tariff Rates</Text>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Section 122 (Universal)</Text>
              <Text style={styles.refValue}>10%</Text>
            </View>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Section 301 (China)</Text>
              <Text style={styles.refValue}>25%</Text>
            </View>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Section 232 (Steel)</Text>
              <Text style={styles.refValue}>25%</Text>
            </View>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>Section 232 (Aluminum)</Text>
              <Text style={styles.refValue}>10%</Text>
            </View>
            <View style={styles.refDivider} />
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>MPF Rate</Text>
              <Text style={styles.refValue}>0.3464%</Text>
            </View>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>MPF Min / Max</Text>
              <Text style={styles.refValue}>$31.67 / $614.35</Text>
            </View>
            <View style={styles.refRow}>
              <Text style={styles.refLabel}>HMF (Ocean only)</Text>
              <Text style={styles.refValue}>0.125%</Text>
            </View>
          </Card>

          <Card style={styles.referenceCard}>
            <Text style={styles.refHeader}>FTA Exempt Countries</Text>
            <Text style={styles.refBody}>
              Mexico (USMCA) {'\u00B7'} Canada (USMCA) {'\u00B7'} South Korea (KORUS) {'\u00B7'} Australia (AUSFTA)
            </Text>
          </Card>
        </View>
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
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: { fontSize: 24 },
  toolContent: { flex: 1 },
  toolTitle: { ...typography.bodyMedium, color: colors.neutral[900], marginBottom: 2 },
  toolDescription: { ...typography.caption, color: colors.neutral[500], lineHeight: 18 },
  chevron: { fontSize: 24, color: colors.neutral[400] },
  referenceSection: { marginTop: spacing['2xl'] },
  referenceTitle: { ...typography.h3, color: colors.neutral[900], marginBottom: spacing.md },
  referenceCard: { marginBottom: spacing.md },
  refHeader: { ...typography.bodyMedium, color: colors.neutral[800], marginBottom: spacing.md },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  refLabel: { ...typography.body, color: colors.neutral[600] },
  refValue: { ...typography.bodyMedium, color: colors.neutral[900] },
  refDivider: { height: 1, backgroundColor: colors.neutral[100], marginVertical: spacing.sm },
  refBody: { ...typography.body, color: colors.neutral[600], lineHeight: 22 },
});
