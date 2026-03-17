import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { RootStackScreenProps } from '../../navigation/types';

export function RegisterScreen({ navigation }: RootStackScreenProps<'Register'>) {
  const { signUp, isLoading, error, clearError } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    try {
      await signUp(email.trim(), password, displayName.trim() || undefined);
    } catch {
      // Error handled by auth context
    }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start managing your import compliance
            </Text>
          </View>

          <View style={styles.form}>
            {displayError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              textContentType="name"
            />

            <Input
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChangeText={(text) => {
                clearError();
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(text) => {
                setLocalError('');
                setPassword(text);
              }}
              secureTextEntry
              textContentType="newPassword"
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setLocalError('');
                setConfirmPassword(text);
              }}
              secureTextEntry
              textContentType="newPassword"
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={!email.trim() || !password || !confirmPassword}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing['3xl'] },
  title: { ...typography.h1, color: colors.neutral[900], marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.neutral[500], textAlign: 'center' },
  form: { gap: spacing.md },
  errorBanner: {
    backgroundColor: colors.danger[50],
    borderWidth: 1,
    borderColor: colors.danger[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  errorText: { ...typography.body, color: colors.danger[700] },
  registerButton: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing['3xl'] },
  footerText: { ...typography.body, color: colors.neutral[500] },
  linkText: { ...typography.bodyMedium, color: colors.primary[600] },
});
