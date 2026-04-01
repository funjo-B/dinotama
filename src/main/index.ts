import { config } from 'dotenv';
import { app } from 'electron';
import { createMainWindow, getMainWindow } from './window';
import { createTray } from './tray';
import { registerDeepLink, handleSecondInstance } from './deeplink';
import { setupAuthIPC } from './auth';

// Load .env for main process (Google OAuth keys, etc.)
config();

// Register deep link protocol
registerDeepLink();

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    handleSecondInstance(commandLine);
  });

  app.whenReady().then(() => {
    const isDev = !app.isPackaged;
    createMainWindow(isDev);
    createTray();
    setupAuthIPC();

    if (isDev) {
      console.log('[DinoTama] Dev mode — renderer at http://localhost:5173');
    }
  });

  // macOS: handle deep link via open-url event
  app.on('open-url', (_event, url) => {
    const win = getMainWindow();
    if (win) {
      win.webContents.send('dino:deep-link', url);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
    }
  });
}
