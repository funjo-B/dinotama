import { app } from 'electron';
import path from 'path';
import { getMainWindow } from './window';

const PROTOCOL = 'dinotama';

export function registerDeepLink() {
  // Register protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

export function handleDeepLinkUrl(url: string) {
  const win = getMainWindow();
  if (!win) return;

  // Parse the deep link URL
  // Format: dinotama://auth?token=xxx or dinotama://action/param
  try {
    const parsed = new URL(url);
    const action = parsed.hostname; // 'auth', 'gacha', etc.

    win.webContents.send('dino:deep-link', {
      action,
      params: Object.fromEntries(parsed.searchParams),
      path: parsed.pathname,
    });

    win.show();
    win.focus();
  } catch (err) {
    console.error('Failed to parse deep link:', url, err);
  }
}

export function handleSecondInstance(commandLine: string[]) {
  const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL}://`));
  if (url) {
    handleDeepLinkUrl(url);
  }

  const win = getMainWindow();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
}
