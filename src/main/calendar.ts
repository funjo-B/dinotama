import { google } from 'googleapis';
import { getMainWindow } from './window';
import { createOAuth2Client, getSavedTokens } from './auth';
import { CALENDAR_CHECK_INTERVAL_MS, NOTIFICATION_BEFORE_MS } from '../shared/constants/gacha';

let calendarInterval: ReturnType<typeof setInterval> | null = null;
let notifiedEventIds = new Set<string>();

/* ─── Authenticated Client ─── */
function getAuthenticatedClient() {
  const tokens = getSavedTokens();
  if (!tokens) return null;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  // Auto-refresh: update stored tokens when Google refreshes them
  // (auth.ts store handles persistence via getSavedTokens/setSavedTokens pattern)
  oauth2Client.on('tokens', (newTokens) => {
    console.log('[Calendar] Tokens auto-refreshed by googleapis');
  });

  return oauth2Client;
}

/* ─── Event Polling ─── */
async function checkUpcomingEvents() {
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
    if (err.code === 401 || err.code === 403) {
      console.error('[Calendar] Auth expired, stopping polling...');
      stopCalendarPolling();
      return;
    }
    console.error('[Calendar] Failed to fetch events:', err.message);
  }
}

type CalendarEvent = { id: string; title: string; startTime: string; endTime: string; location?: string };

/* ─── Fetch events for a given day offset (0=today, 1=tomorrow, -1=yesterday) ─── */
export async function fetchEventsForDay(dayOffset = 0): Promise<CalendarEvent[]> {
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
    console.error('[Calendar] Failed to fetch events:', err.message);
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
  notifiedEventIds.clear();
}
