import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export type AuthUser = FirebaseAuthTypes.User;

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await auth().signInWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  const credential = await auth().createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await credential.user.updateProfile({ displayName });
  }
  return credential.user;
}

export async function signOut(): Promise<void> {
  await auth().signOut();
}

export async function resetPassword(email: string): Promise<void> {
  await auth().sendPasswordResetEmail(email);
}

export async function deleteAccount(): Promise<void> {
  const user = auth().currentUser;
  if (user) {
    await user.delete();
  }
}

export function getAuthErrorMessage(error: { code: string }): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to perform this action.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
