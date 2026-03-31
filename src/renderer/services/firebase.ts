import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { UserData } from '@shared/types';
import { SYNC_INTERVAL_MS } from '@shared/constants';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let syncInterval: ReturnType<typeof setInterval> | null = null;

/** Sign in with Google OAuth credential (from Electron deep link flow) */
export async function signInWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

/** Listen to auth state changes */
export function onAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/** Get current user */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/** Save user data to Firestore */
export async function saveUserData(userData: UserData): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    lastSyncTime: Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Load user data from Firestore */
export async function loadUserData(): Promise<UserData | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const snapshot = await getDoc(doc(db, 'users', user.uid));
  if (!snapshot.exists()) return null;

  return snapshot.data() as UserData;
}

/** Start periodic sync (30 min) */
export function startAutoSync(getLatestData: () => UserData) {
  stopAutoSync();
  syncInterval = setInterval(async () => {
    try {
      const data = getLatestData();
      await saveUserData(data);
      console.log('[Firebase] Auto-sync complete');
    } catch (err) {
      console.error('[Firebase] Auto-sync failed:', err);
    }
  }, SYNC_INTERVAL_MS);
}

/** Stop periodic sync */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/** Immediate sync (on important events) */
export async function syncNow(userData: UserData): Promise<void> {
  await saveUserData(userData);
}

export { auth, db };
