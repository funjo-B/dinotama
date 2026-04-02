import { google } from 'googleapis';
import { ipcMain, shell } from 'electron';
import { createServer, type Server } from 'http';
import { URL } from 'url';
import { getMainWindow } from './window';
import { refreshTrayMenu } from './tray';
import { startCalendarPolling, stopCalendarPolling, fetchTodayEvents, fetchEventsForDay } from './calendar';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require('electron-store');

interface StoreType {
  get(key: string): any;
  set(key: string, value: any): void;
  delete(key: string): void;
}

let _store: StoreType | null = null;
function getStore(): StoreType {
  if (!_store) {
    _store = new Store({
      name: 'dinotama-auth',
      encryptionKey: 'dinotama-auth-v1',
    }) as StoreType;
  }
  return _store!;
}

/* ─── OAuth2 Config ─── */
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
];
const REDIRECT_PORT = 48521;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? '';
}

function getClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET ?? '';
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(getClientId(), getClientSecret(), REDIRECT_URI);
}

/* ─── State ─── */
let callbackServer: Server | null = null;

export interface AuthTokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
}

/* ─── Public: get/set saved tokens ─── */
export function getSavedTokens(): AuthTokens | undefined {
  return getStore().get('authTokens');
}

export function updateSavedTokens(partial: Partial<AuthTokens>) {
  const existing = getSavedTokens();
  if (!existing) return;
  getStore().set('authTokens', { ...existing, ...partial });
}

/* ─── IPC Setup ─── */
export function setupAuthIPC() {
  ipcMain.handle('dino:auth-login', async () => {
    return startOAuthFlow();
  });

  ipcMain.handle('dino:auth-logout', () => {
    logout();
    return true;
  });

  ipcMain.handle('dino:auth-status', () => {
    const tokens = getSavedTokens();
    return { loggedIn: !!tokens };
  });

  ipcMain.handle('dino:calendar-today', async () => {
    return fetchTodayEvents();
  });

  ipcMain.handle('dino:calendar-day', async (_event, dayOffset: number) => {
    return fetchEventsForDay(dayOffset ?? 0);
  });

  // Tray menu triggers (within main process)
  ipcMain.on('dino:auth-login-from-tray', async () => {
    const result = await startOAuthFlow();
    if (!result.success) {
      console.error('[Auth] Login from tray failed:', result.error);
    }
  });

  ipcMain.on('dino:auth-logout-from-tray', () => {
    logout();
  });

  // Auto-restore: if tokens exist, start calendar polling
  const saved = getSavedTokens();
  if (saved) {
    console.log('[Auth] Found saved tokens, restoring session...');
    startCalendarPolling();

    // Wait for renderer to be ready before sending auth-restored
    const sendAuthRestored = () => {
      const w = getMainWindow();
      if (!w) return;
      w.webContents.send('dino:auth-restored', { idToken: saved.id_token });
      console.log('[Auth] Sent auth-restored to renderer');
    };

    const win = getMainWindow();
    if (win?.webContents.isLoading()) {
      win.webContents.once('did-finish-load', sendAuthRestored);
    } else if (win) {
      // Already loaded (unlikely at startup, but safe)
      sendAuthRestored();
    } else {
      // Window not created yet — poll briefly
      let attempts = 0;
      const waitForWindow = setInterval(() => {
        attempts++;
        const w = getMainWindow();
        if (w) {
          clearInterval(waitForWindow);
          if (w.webContents.isLoading()) {
            w.webContents.once('did-finish-load', sendAuthRestored);
          } else {
            sendAuthRestored();
          }
        } else if (attempts > 30) { // 30 * 200ms = 6s max
          clearInterval(waitForWindow);
          console.error('[Auth] Window never became available for auth restore');
        }
      }, 200);
    }
  }
}

/* ─── OAuth Flow ─── */
async function startOAuthFlow(): Promise<{ success: boolean; error?: string }> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  if (!clientId || !clientSecret) {
    return { success: false, error: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in .env' };
  }

  const oauth2Client = createOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  try {
    const codePromise = waitForAuthCode();

    // Open browser for Google login
    shell.openExternal(authUrl);

    const authCode = await codePromise;

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);

    if (!tokens.access_token || !tokens.refresh_token) {
      return { success: false, error: 'Failed to get tokens from Google' };
    }

    const authTokens: AuthTokens = {
      id_token: tokens.id_token ?? '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ?? undefined,
    };

    // Save tokens
    getStore().set('authTokens', authTokens);

    // Start calendar polling
    startCalendarPolling();
    refreshTrayMenu();

    // Send id_token to renderer for Firebase Auth
    const win = getMainWindow();
    win?.webContents.send('dino:auth-success', {
      idToken: authTokens.id_token,
    });

    console.log('[Auth] Login successful');
    return { success: true };
  } catch (err: any) {
    console.error('[Auth] OAuth flow failed:', err);
    return { success: false, error: err.message ?? 'OAuth flow failed' };
  }
}

function closeCallbackServer(): Promise<void> {
  return new Promise((resolve) => {
    if (callbackServer) {
      const s = callbackServer;
      callbackServer = null;
      s.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function waitForAuthCode(): Promise<string> {
  // Ensure previous server is fully closed before starting a new one
  await closeCallbackServer();

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>로그인 실패</h2><p>${error}</p><p>이 창을 닫아도 됩니다.</p></body></html>`);
        reject(new Error(`OAuth error: ${error}`));
      } else if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>DinoTama 로그인 완료!</h2><p>이 창을 닫아도 됩니다.</p></body></html>`);
        resolve(code);
      } else {
        res.writeHead(400);
        res.end('Missing code');
      }

      setTimeout(() => {
        closeCallbackServer();
      }, 1000);
    });

    server.listen(REDIRECT_PORT, () => {
      callbackServer = server;
    });

    server.on('error', (err) => {
      reject(err);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      if (callbackServer === server) {
        closeCallbackServer();
        reject(new Error('Login timeout — no response within 2 minutes'));
      }
    }, 120_000);
  });
}

function logout() {
  stopCalendarPolling();
  getStore().delete('authTokens');
  refreshTrayMenu();

  const win = getMainWindow();
  win?.webContents.send('dino:auth-logout');

  console.log('[Auth] Logged out');
}
