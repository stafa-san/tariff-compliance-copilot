import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

// iOS Client ID from GoogleService-Info.plist
const IOS_CLIENT_ID =
  '385953688058-k43j054n4bfhftcttroot30bmsgo2vnf.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((err) => {
          console.error('Google sign-in credential error:', err);
        });
      }
    }
  }, [response]);

  const signInWithGoogle = async () => {
    await promptAsync();
  };

  return {
    signInWithGoogle,
    isReady: !!request,
  };
}
