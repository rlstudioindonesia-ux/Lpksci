import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isConfigured = Object.keys(firebaseConfig).length > 0;
const configToUse = isConfigured ? firebaseConfig : {
  apiKey: "AIzaSyDummyKeyDummyKeyDummyKeyDummyKey12",
  authDomain: "dummy-domain.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

const app = getApps().length === 0 ? initializeApp(configToUse) : getApp();
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app, (configToUse as any).firestoreDatabaseId);
