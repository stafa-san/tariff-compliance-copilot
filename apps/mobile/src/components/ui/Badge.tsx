import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <View style={[styles.base, sizeStyles[size], variantBgStyles[variant]]}>
      <Text style={[styles.text, sizeTextStyles[size], variantTextStyles[variant]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
};

const sizeTextStyles: Record<string, TextStyle> = {
  sm: { fontSize: 11 },
  md: { fontSize: 12 },
};

const variantBgStyles: Record<BadgeVariant, ViewStyle> = {
  default: { backgroundColor: colors.neutral[100] },
  success: { backgroundColor: colors.success[100] },
  warning: { backgroundColor: colors.warning[100] },
  danger: { backgroundColor: colors.danger[100] },
  info: { backgroundColor: colors.primary[100] },
};

const variantTextStyles: Record<BadgeVariant, TextStyle> = {
  default: { color: colors.neutral[700] },
  success: { color: colors.success[700] },
  warning: { color: colors.warning[700] },
  danger: { color: colors.danger[700] },
  info: { color: colors.primary[700] },
};
