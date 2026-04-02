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
let syncInProgress = false;
let lastSyncHash = ''; // Track if data actually changed

/* ─── Retry helper ─── */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2,
  delayMs = 1000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        console.warn(`[Firebase] ${label} failed (attempt ${attempt + 1}), retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

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

/** Save user data to Firestore (with retry) */
export async function saveUserData(userData: UserData): Promise<void> {
  const uid = userData.uid || auth.currentUser?.uid;
  if (!uid) return;

  await withRetry(
    () => setDoc(doc(db, 'users', uid), {
      ...userData,
      lastSyncTime: Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true }),
    'saveUserData',
  );
  console.log('[Firebase] Data saved for', uid);
}

/** Load user data from Firestore (with retry) */
export async function loadUserData(uid?: string): Promise<UserData | null> {
  const resolvedUid = uid || auth.currentUser?.uid;
  if (!resolvedUid) return null;

  const snapshot = await withRetry(
    () => getDoc(doc(db, 'users', resolvedUid)),
    'loadUserData',
  );
  if (!snapshot.exists()) return null;

  console.log('[Firebase] Data loaded for', resolvedUid);
  return snapshot.data() as UserData;
}

/** Start periodic sync (30 min) with duplicate guard + skip-if-unchanged */
export function startAutoSync(getLatestData: () => UserData) {
  stopAutoSync();
  syncInterval = setInterval(async () => {
    if (syncInProgress) {
      console.warn('[Firebase] Auto-sync skipped — previous sync still running');
      return;
    }
    syncInProgress = true;
    try {
      const data = getLatestData();
      // Skip write if data hasn't changed since last sync
      const { lastSyncTime, ...rest } = data;
      const hash = JSON.stringify(rest);
      if (hash === lastSyncHash) {
        console.log('[Firebase] Auto-sync skipped — no changes');
        return;
      }
      await saveUserData(data);
      lastSyncHash = hash;
      console.log('[Firebase] Auto-sync complete');
    } catch (err) {
      console.error('[Firebase] Auto-sync failed after retries:', err);
    } finally {
      syncInProgress = false;
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
  const { lastSyncTime, ...rest } = userData;
  lastSyncHash = JSON.stringify(rest);
}

/** Save todos to Firestore (with retry) */
export async function saveTodosToCloud(uid: string, todos: TodoItem[]): Promise<void> {
  await withRetry(
    () => setDoc(
      doc(db, 'users', uid, 'data', 'todos'),
      { items: todos, updatedAt: serverTimestamp() },
      { merge: false },
    ),
    'saveTodos',
  );
  console.log('[Firebase] Todos saved:', todos.length, 'items');
}

/** Load todos from Firestore (with retry) */
export async function loadTodosFromCloud(uid: string): Promise<TodoItem[] | null> {
  const snap = await withRetry(
    () => getDoc(doc(db, 'users', uid, 'data', 'todos')),
    'loadTodos',
  );
  if (!snap.exists()) return null;
  const data = snap.data();
  return Array.isArray(data.items) ? data.items : null;
}

export { auth, db };
