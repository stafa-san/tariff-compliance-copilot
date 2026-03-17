import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as firebaseSignOut,
  resetPassword,
  getAuthErrorMessage,
} from '../services/auth/authService';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setAuthState(firebaseUser ? 'authenticated' : 'unauthenticated');
    });
    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err as { code: string });
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err as { code: string });
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut();
    } catch {
      setError('Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err as { code: string });
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        signIn,
        signUp,
        logout,
        sendPasswordReset,
        error,
        clearError,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
