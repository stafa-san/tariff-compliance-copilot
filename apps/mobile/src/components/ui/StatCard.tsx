import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography, shadows } from '../../theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, subtitle, icon, color = colors.primary[600] }: StatCardProps) {
  return (
    <View style={[styles.container, shadows.sm]}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            {icon}
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.caption,
    color: colors.neutral[500],
    flex: 1,
  },
  value: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutral[400],
    marginTop: 2,
  },
});
