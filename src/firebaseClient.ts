import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeFirestore, getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Always use custom authDomain lpksci.com so Google OAuth redirects to
// https://lpksci.com/__/auth/handler instead of gen-lang-client-0782283050.firebaseapp.com
const activeFirebaseConfig = {
  ...firebaseConfig,
  authDomain: "lpksci.com",
};

// Initialize Firebase SDK with production project configuration
export const app = getApps().length === 0 ? initializeApp(activeFirebaseConfig) : getApp();

export const auth = getAuth(app);
export const storage = (firebaseConfig as any).storageBucket
  ? getStorage(app, (firebaseConfig as any).storageBucket.startsWith("gs://") ? (firebaseConfig as any).storageBucket : `gs://${(firebaseConfig as any).storageBucket}`)
  : getStorage(app);

const databaseId = (firebaseConfig as any).firestoreDatabaseId || "(default)";

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, databaseId);
} catch {
  firestoreInstance = getFirestore(app, databaseId);
}

export const db = firestoreInstance;
