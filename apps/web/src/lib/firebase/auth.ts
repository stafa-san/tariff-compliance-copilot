import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  type User,
  type AuthError,
} from "firebase/auth";
import { auth } from "./config";

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signOut = () => firebaseSignOut(auth);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // Try popup first (works on localhost and most browsers)
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const authError = error as AuthError;
    // If popup blocked, fall back to redirect
    if (authError.code === "auth/popup-blocked") {
      return signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
};

export const handleRedirectResult = () => getRedirectResult(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): string {
  const code = (error as AuthError)?.code;
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Redirecting...";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Add it to your Firebase Console under Authentication > Settings > Authorized domains.";
    default:
      console.error("Auth error:", code, error);
      return `Authentication failed (${code || "unknown error"}). Check the console for details.`;
  }
}
