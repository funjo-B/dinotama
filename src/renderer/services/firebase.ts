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
import type { UserData, TodoItem } from '@shared/types';
import { SYNC_INTERVAL_MS } from '@shared/constants';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('[Firebase] Config loaded:', {
  apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
  projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
  authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
  appId: firebaseConfig.appId ? 'SET' : 'MISSING',
});

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
  const uid = userData.uid || auth.currentUser?.uid;
  if (!uid) return;

  await setDoc(doc(db, 'users', uid), {
    ...userData,
    lastSyncTime: Date.now(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  console.log('[Firebase] Data saved for', uid);
}

/** Load user data from Firestore */
export async function loadUserData(uid?: string): Promise<UserData | null> {
  const resolvedUid = uid || auth.currentUser?.uid;
  if (!resolvedUid) return null;

  const snapshot = await getDoc(doc(db, 'users', resolvedUid));
  if (!snapshot.exists()) return null;

  console.log('[Firebase] Data loaded for', resolvedUid);
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

/** Save todos to Firestore (separate doc to avoid UserData conflicts) */
export async function saveTodosToCloud(uid: string, todos: TodoItem[]): Promise<void> {
  await setDoc(
    doc(db, 'users', uid, 'data', 'todos'),
    { items: todos, updatedAt: serverTimestamp() },
    { merge: false }
  );
  console.log('[Firebase] Todos saved:', todos.length, 'items');
}

/** Load todos from Firestore */
export async function loadTodosFromCloud(uid: string): Promise<TodoItem[] | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'todos'));
  if (!snap.exists()) return null;
  const data = snap.data();
  return Array.isArray(data.items) ? data.items : null;
}

export { auth, db };
