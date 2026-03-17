import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase is auto-initialized via GoogleService-Info.plist (iOS) and google-services.json (Android)
// No manual initialization needed with @react-native-firebase

export { firebase, auth, firestore, storage };
export default firebase;
