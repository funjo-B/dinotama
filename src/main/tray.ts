import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { getMainWindow } from './window';
import { getSavedTokens } from './auth';

let tray: Tray | null = null;

export function createTray(): Tray | null {
  const iconPath = path.join(__dirname, '../../public/assets/icons/tray-icon.png');
  let icon: Electron.NativeImage;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('empty icon');
  } catch {
    icon = nativeImage.createFromBuffer(createFallbackIcon());
    icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip('DinoTama');

  const contextMenu = buildTrayMenu();
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });

  return tray;
}

function buildTrayMenu(): Menu {
  const isLoggedIn = !!getSavedTokens();

  return Menu.buildFromTemplate([
    {
      label: 'DinoTama 보기',
      click: () => {
        const win = getMainWindow();
        win?.show();
        win?.focus();
      },
    },
    { type: 'separator' },
    {
      label: isLoggedIn ? 'Google 로그인됨' : 'Google 로그인',
      enabled: !isLoggedIn,
      click: () => {
        const { ipcMain } = require('electron');
        ipcMain.emit('dino:auth-login-from-tray');
      },
    },
    ...(isLoggedIn
      ? [
          {
            label: '로그아웃',
            click: () => {
              const { ipcMain } = require('electron');
              ipcMain.emit('dino:auth-logout-from-tray');
            },
          } as Electron.MenuItemConstructorOptions,
        ]
      : []),
    { type: 'separator' },
    {
      label: '위치 초기화',
      click: () => {
        const win = getMainWindow();
        if (win) {
          const { screen } = require('electron');
          const { width, height } = screen.getPrimaryDisplay().workAreaSize;
          const [w, h] = win.getSize();
          win.setPosition(width - w - 10, height - h - 10);
        }
      },
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.removeAllListeners('close');
          win.close();
        }
        app.quit();
      },
    },
  ]);
}

export function refreshTrayMenu() {
  tray?.setContextMenu(buildTrayMenu());
}

// Creates a minimal PNG buffer for a 16x16 green circle
function createFallbackIcon(): Buffer {
  const size = 16;
  const channels = 4;
  const pixels = Buffer.alloc(size * size * channels, 0);

  const cx = size / 2;
  const cy = size / 2;
  const r = 6;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const idx = (y * size + x) * channels;
        pixels[idx] = 74;     // R
        pixels[idx + 1] = 222; // G
        pixels[idx + 2] = 128; // B
        pixels[idx + 3] = 255; // A
      }
    }
  }

  return nativeImage.createFromBuffer(pixels, { width: size, height: size }).toPNG();
}

export function getTray() {
  return tray;
}
