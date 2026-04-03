import { google, type Auth } from 'googleapis';
import { getMainWindow } from './window';
import { createOAuth2Client, getSavedTokens, updateSavedTokens } from './auth';
import { CALENDAR_CHECK_INTERVAL_MS, NOTIFICATION_BEFORE_MS } from '../shared/constants/gacha';

let calendarInterval: ReturnType<typeof setInterval> | null = null;
let notifiedEventIds = new Set<string>();
let authFailCount = 0;
const MAX_AUTH_RETRIES = 3;

// Token refresh buffer: refresh 5 minutes before actual expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/* ─── Singleton Authenticated Client ─── */
let cachedClient: Auth.OAuth2Client | null = null;

function getAuthenticatedClient() {
  const tokens = getSavedTokens();
  if (!tokens) {
    if (cachedClient) { cachedClient.removeAllListeners('tokens'); }
    cachedClient = null;
    return null;
  }

  // Reuse cached client if still valid
  if (cachedClient) {
    const creds = cachedClient.credentials;
    // Update credentials if stored tokens are newer
    if (creds.access_token !== tokens.access_token) {
      cachedClient.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      });
    }
    return cachedClient;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Auto-refresh: persist refreshed tokens to electron-store
  oauth2Client.on('tokens', (newTokens) => {
    console.log('[Calendar] Tokens auto-refreshed, saving...');
    updateSavedTokens({
      access_token: newTokens.access_token ?? undefined,
      refresh_token: newTokens.refresh_token ?? undefined,
      id_token: newTokens.id_token ?? undefined,
      expiry_date: newTokens.expiry_date ?? undefined,
    });
  });

  cachedClient = oauth2Client;
  return oauth2Client;
}

/* ─── Proactive token refresh ─── */
async function ensureFreshToken() {
  const tokens = getSavedTokens();
  if (!tokens?.expiry_date) return;

  const timeUntilExpiry = tokens.expiry_date - Date.now();
  if (timeUntilExpiry < TOKEN_REFRESH_BUFFER_MS && tokens.refresh_token) {
    console.log('[Calendar] Token expiring soon, refreshing proactively...');
    try {
      const client = getAuthenticatedClient();
      if (client) {
        const { credentials } = await client.refreshAccessToken();
        updateSavedTokens({
          access_token: credentials.access_token ?? undefined,
          refresh_token: credentials.refresh_token ?? undefined,
          expiry_date: credentials.expiry_date ?? undefined,
        });
        console.log('[Calendar] Token proactively refreshed');
      }
    } catch (err: any) {
      console.error('[Calendar] Proactive refresh failed:', err.message);
    }
  }
}

export function resetCachedClient() {
  if (cachedClient) {
    cachedClient.removeAllListeners('tokens');
  }
  cachedClient = null;
}

/* ─── Event Polling ─── */
async function checkUpcomingEvents() {
  await ensureFreshToken();
  const auth = getAuthenticatedClient();
  if (!auth) return;

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const soon = new Date(now.getTime() + NOTIFICATION_BEFORE_MS + CALENDAR_CHECK_INTERVAL_MS);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: soon.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items ?? [];
    authFailCount = 0; // Reset on successful fetch

    for (const event of events) {
      if (!event.id || notifiedEventIds.has(event.id)) continue;

      const startTime = event.start?.dateTime ?? event.start?.date;
      if (!startTime) continue;

      const eventStart = new Date(startTime).getTime();
      const timeUntil = eventStart - Date.now();

      if (timeUntil > 0 && timeUntil <= NOTIFICATION_BEFORE_MS) {
        notifiedEventIds.add(event.id);

        const win = getMainWindow();
        win?.webContents.send('dino:calendar-notify', {
          id: event.id,
          title: event.summary ?? '(제목 없음)',
          startTime,
          timeUntilMs: timeUntil,
          location: event.location,
        });
      }
    }

    // Clean up old notified IDs
    if (notifiedEventIds.size > 100) {
      const arr = [...notifiedEventIds];
      notifiedEventIds = new Set(arr.slice(-50));
    }
  } catch (err: any) {
    if (err.code === 401 || err.code === 403 || err.status === 401 || err.status === 403) {
      authFailCount++;
      console.error(`[Calendar] Auth error (attempt ${authFailCount}/${MAX_AUTH_RETRIES})`);

      if (authFailCount >= MAX_AUTH_RETRIES) {
        console.error('[Calendar] Max retries reached, stopping polling. Re-login required.');
        stopCalendarPolling();
        // Notify renderer that calendar auth failed
        const win = getMainWindow();
        win?.webContents.send('dino:calendar-auth-expired');
      }
      return;
    }
    console.error('[Calendar] Failed to fetch events:', err.message);
  }
}

type CalendarEvent = { id: string; title: string; startTime: string; endTime: string; location?: string };

/* ─── Fetch events for a given day offset (0=today, 1=tomorrow, -1=yesterday) ─── */
export async function fetchEventsForDay(dayOffset = 0): Promise<CalendarEvent[]> {
  await ensureFreshToken();
  const auth = getAuthenticatedClient();
  if (!auth) return [];

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  const endOfDay   = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items ?? []).map((event) => ({
      id: event.id ?? '',
      title: event.summary ?? '(제목 없음)',
      startTime: event.start?.dateTime ?? event.start?.date ?? '',
      endTime: event.end?.dateTime ?? event.end?.date ?? '',
      location: event.location ?? undefined,
    }));
  } catch (err: any) {
    if (err.code === 401 || err.code === 403 || err.status === 401 || err.status === 403) {
      console.error('[Calendar] Auth expired for day fetch, attempting refresh...');
      // Try once more after forcing a token refresh
      if (cachedClient) { cachedClient.removeAllListeners('tokens'); }
      cachedClient = null;
      try {
        await ensureFreshToken();
        const retryAuth = getAuthenticatedClient();
        if (retryAuth) {
          const retryCalendar = google.calendar({ version: 'v3', auth: retryAuth });
          const retryResp = await retryCalendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });
          console.log('[Calendar] Retry succeeded after token refresh');
          return (retryResp.data.items ?? []).map((event) => ({
            id: event.id ?? '',
            title: event.summary ?? '(제목 없음)',
            startTime: event.start?.dateTime ?? event.start?.date ?? '',
            endTime: event.end?.dateTime ?? event.end?.date ?? '',
            location: event.location ?? undefined,
          }));
        }
      } catch (retryErr: any) {
        console.error('[Calendar] Retry also failed:', retryErr.message);
        const win = getMainWindow();
        win?.webContents.send('dino:calendar-auth-expired');
      }
    } else {
      console.error('[Calendar] Failed to fetch events:', err.message);
    }
    return [];
  }
}

/* ─── Fetch today's events (for TodoPanel, backwards compat) ─── */
export async function fetchTodayEvents(): Promise<CalendarEvent[]> {
  return fetchEventsForDay(0);
}

/* ─── Start / Stop ─── */
export function startCalendarPolling() {
  stopCalendarPolling();
  checkUpcomingEvents();
  calendarInterval = setInterval(checkUpcomingEvents, CALENDAR_CHECK_INTERVAL_MS);
  console.log('[Calendar] Polling started');
}

export function stopCalendarPolling() {
  if (calendarInterval) {
    clearInterval(calendarInterval);
    calendarInterval = null;
  }
  authFailCount = 0; // 재로그인 시 카운터 초기화
  notifiedEventIds.clear();
  if (cachedClient) {
    cachedClient.removeAllListeners('tokens');
  }
  cachedClient = null;
}
