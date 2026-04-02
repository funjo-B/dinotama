import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useDinoStore } from '../stores/dinoStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubSuccess: (() => void) | undefined;
    let unsubRestored: (() => void) | undefined;
    let unsubLogout: (() => void) | undefined;

    // Firebase module references (set after async import)
    let pendingIdToken: string | null = null;
    let firebaseModule: Awaited<typeof import('../services/firebase')> | null = null;

    const handleSignIn = async (idToken: string) => {
      if (!idToken) return;
      if (!firebaseModule) {
        pendingIdToken = idToken;
        return;
      }
      try {
        await firebaseModule.signInWithGoogle(idToken);
        console.log('[Auth] Firebase sign-in successful');
      } catch (err: unknown) {
        console.error('[Auth] Firebase sign-in failed:', err);
      }
    };

    const handleLogout = async () => {
      console.log('[Auth] Received logout event');
      if (!firebaseModule) return;
      const { auth, saveUserData, stopAutoSync } = firebaseModule;
      const snap = useDinoStore.getState().getSnapshot();
      const currentUser = auth.currentUser;

      let saveFailed = false;
      if (currentUser && snap.dinos.length > 0) {
        try {
          await saveUserData({
            uid: currentUser.uid,
            displayName: currentUser.displayName ?? '',
            email: currentUser.email ?? '',
            ...snap,
            lastSyncTime: Date.now(),
          });
        } catch (err: unknown) {
          console.error('[Auth] Save before logout failed:', err);
          saveFailed = true;
        }
      }

      if (saveFailed) {
        console.warn('[Auth] Proceeding with logout despite save failure — local data preserved in store');
      }

      stopAutoSync();
      try {
        await auth.signOut();
      } catch (err: unknown) {
        console.error('[Auth] Firebase signOut failed:', err);
      }
      useDinoStore.getState().resetState();
      console.log('[Auth] Logged out, state reset');
    };

    // Register IPC listeners IMMEDIATELY (before async firebase import)
    unsubSuccess = window.dinoAPI?.onAuthSuccess?.((data: { idToken: string }) => {
      console.log('[Auth] Received auth-success event, idToken:', !!data.idToken);
      handleSignIn(data.idToken);
    });

    unsubRestored = window.dinoAPI?.onAuthRestored?.((data: { idToken: string }) => {
      console.log('[Auth] Received auth-restored event, idToken:', !!data.idToken);
      handleSignIn(data.idToken);
    });

    unsubLogout = window.dinoAPI?.onAuthLogout?.(() => {
      handleLogout();
    });

    // Now load firebase asynchronously
    import('../services/firebase')
      .then((mod) => {
        firebaseModule = mod;
        const { onAuth, auth, loadUserData, startAutoSync, stopAutoSync } = mod;

        unsubAuth = onAuth(async (u) => {
          setUser(u);
          setLoading(false);

          if (u) {
            try {
              const cloudData = await loadUserData(u.uid);
              if (cloudData) {
                useDinoStore.getState().loadFromCloud({
                  dinos: cloudData.dinos ?? [],
                  activeDinoId: cloudData.activeDinoId ?? null,
                  coins: cloudData.coins ?? 100,
                  premiumCurrency: cloudData.premiumCurrency ?? 0,
                  gacha: cloudData.gacha ?? { totalPulls: 0, pullsSinceEpic: 0, pullsSinceLegend: 0 },
                });
                console.log('[Auth] Cloud data loaded');
              } else {
                console.log('[Auth] No cloud data, using local state');
              }
            } catch (err) {
              console.warn('[Auth] Failed to load cloud data:', err);
            }

            startAutoSync(() => {
              const snap = useDinoStore.getState().getSnapshot();
              return {
                uid: u.uid,
                displayName: u.displayName ?? '',
                email: u.email ?? '',
                ...snap,
                lastSyncTime: Date.now(),
              };
            });
          } else {
            stopAutoSync();
          }
        });

        // Process any event that arrived before firebase was ready
        if (pendingIdToken && !auth.currentUser) {
          console.log('[Auth] Processing queued idToken');
          handleSignIn(pendingIdToken);
          pendingIdToken = null;
        }
      })
      .catch((err) => {
        console.warn('[Auth] Firebase init skipped:', err.message);
        setLoading(false);
      });

    return () => {
      unsubAuth?.();
      unsubSuccess?.();
      unsubRestored?.();
      unsubLogout?.();
    };
  }, []);

  return { user, loading };
}
