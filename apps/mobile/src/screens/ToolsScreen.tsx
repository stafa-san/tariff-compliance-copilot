import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../components/ui';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import type { MainTabScreenProps } from '../navigation/types';

interface ToolItem {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TOOLS: ToolItem[] = [
  {
    key: 'scenarios',
    title: 'Scenario Simulator',
    description: 'Compare sourcing countries and analyze tariff impact on landed costs',
    icon: 'globe-outline',
    color: colors.primary[600],
  },
  {
    key: 'form7501',
    title: 'CBP Form 7501 Guide',
    description: 'Field-by-field reference for the Entry Summary form (47 fields)',
    icon: 'document-text-outline',
    color: colors.accent[600],
  },
  {
    key: 'audit',
    title: 'AI Compliance Audit',
    description: 'Upload documents for automated compliance review and risk scoring',
    icon: 'shield-checkmark-outline',
    color: colors.success[600],
  },
  {
    key: 'reports',
    title: 'Compliance Reports',
    description: 'Generate and export classification, duty, and audit reports',
    icon: 'bar-chart-outline',
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
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Tools</Text>
          <Text style={styles.subtitle}>
            Advanced compliance tools and reference guides
          </Text>
        </Animated.View>

        {TOOLS.map((tool, index) => (
          <Animated.View key={tool.key} entering={FadeInDown.delay(100 * (index + 1)).duration(400)}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (tool.key === 'audit') {
                  navigation.getParent()?.navigate('Audit');
                }
              }}
            >
              <View style={[styles.toolCard, shadows.sm]}>
                <View style={[styles.iconContainer, { backgroundColor: tool.color + '15' }]}>
                  <Ionicons name={tool.icon} size={24} color={tool.color} />
                </View>
                <View style={styles.toolContent}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription}>{tool.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Trade Remedies Quick Reference */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.referenceSection}>
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
              Mexico (USMCA) · Canada (USMCA) · South Korea (KORUS) · Australia (AUSFTA)
            </Text>
          </Card>
        </Animated.View>
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
  toolContent: { flex: 1 },
  toolTitle: { ...typography.bodyMedium, color: colors.neutral[900], marginBottom: 2 },
  toolDescription: { ...typography.caption, color: colors.neutral[500], lineHeight: 18 },
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
