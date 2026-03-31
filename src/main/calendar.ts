import { google } from 'googleapis';
import { ipcMain } from 'electron';
import { getMainWindow } from './window';
import { CALENDAR_CHECK_INTERVAL_MS, NOTIFICATION_BEFORE_MS } from '../shared/constants/gacha';

let calendarInterval: ReturnType<typeof setInterval> | null = null;
let notifiedEventIds = new Set<string>();

interface CalendarCredentials {
  accessToken: string;
  refreshToken: string;
}

let credentials: CalendarCredentials | null = null;

export function setupCalendarIPC() {
  ipcMain.handle('dino:calendar-set-credentials', (_event, creds: CalendarCredentials) => {
    credentials = creds;
    startCalendarPolling();
    return true;
  });

  ipcMain.handle('dino:calendar-stop', () => {
    stopCalendarPolling();
    return true;
  });
}

function createOAuth2Client() {
  if (!credentials) return null;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
  });
  return oauth2Client;
}

async function checkUpcomingEvents() {
  const auth = createOAuth2Client();
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

      // Notify if event is within 5 minutes
      if (timeUntil > 0 && timeUntil <= NOTIFICATION_BEFORE_MS) {
        notifiedEventIds.add(event.id);

        const win = getMainWindow();
        win?.webContents.send('dino:calendar-notify', {
          id: event.id,
          title: event.summary ?? '(제목 없음)',
          startTime: startTime,
          timeUntilMs: timeUntil,
          location: event.location,
        });
      }
    }

    // Clean up old notified IDs (keep only last 100)
    if (notifiedEventIds.size > 100) {
      const arr = [...notifiedEventIds];
      notifiedEventIds = new Set(arr.slice(-50));
    }
  } catch (err) {
    console.error('[Calendar] Failed to fetch events:', err);
  }
}

function startCalendarPolling() {
  stopCalendarPolling();
  // Check immediately, then every interval
  checkUpcomingEvents();
  calendarInterval = setInterval(checkUpcomingEvents, CALENDAR_CHECK_INTERVAL_MS);
}

function stopCalendarPolling() {
  if (calendarInterval) {
    clearInterval(calendarInterval);
    calendarInterval = null;
  }
}
