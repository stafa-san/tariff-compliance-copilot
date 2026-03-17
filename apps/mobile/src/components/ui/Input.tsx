import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  icon,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={colors.neutral[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.primary[500],
  },
  inputError: {
    borderColor: colors.danger[500],
  },
  iconContainer: {
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.neutral[900],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger[600],
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
});
