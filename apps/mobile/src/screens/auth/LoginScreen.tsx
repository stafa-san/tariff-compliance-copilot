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

export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await signIn(email.trim(), password);
    } catch {
      // Error handled by auth context
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>&#9878;</Text>
            </View>
            <Text style={styles.title}>Tariff Copilot</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your import compliance
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
              autoCorrect={false}
              textContentType="emailAddress"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                clearError();
                setPassword(text);
              }}
              secureTextEntry
              textContentType="password"
              containerStyle={styles.passwordInput}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email.trim() || !password.trim()}
              style={styles.signInButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 32,
    color: colors.white,
  },
  title: {
    ...typography.h1,
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  passwordInput: {
    marginTop: -spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.danger[50],
    borderWidth: 1,
    borderColor: colors.danger[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.danger[700],
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['3xl'],
  },
  footerText: {
    ...typography.body,
    color: colors.neutral[500],
  },
  linkText: {
    ...typography.bodyMedium,
    color: colors.primary[600],
  },
});
