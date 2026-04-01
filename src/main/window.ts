import { BrowserWindow, screen, ipcMain, Menu } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const DINO_WIDTH = 200;
const DINO_HEIGHT = 200;

const SIZE_PRESETS: Record<string, [number, number]> = {
  small: [150, 150],
  medium: [200, 200],
  large: [280, 280],
  xlarge: [360, 360],
};
const EDGE_MARGIN = 10;

export function getMainWindow() {
  return mainWindow;
}

export function createMainWindow(isDev: boolean): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
    x: screenWidth - DINO_WIDTH - EDGE_MARGIN,
    y: screenHeight - DINO_HEIGHT - EDGE_MARGIN,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    type: 'toolbar', // Helps with always-on-top on some WMs
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    const port = process.env.VITE_DEV_PORT || '5173';
    const devURL = `http://localhost:${port}`;

    const loadWithRetry = async (retries = 10, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await mainWindow!.loadURL(devURL);
          return;
        } catch {
          if (i < retries - 1) {
            console.log(`[DinoTama] Vite not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      console.error('[DinoTama] Failed to connect to Vite dev server');
    };

    loadWithRetry();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Open DevTools in dev mode to debug white screen
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Keep always on top at the screen level
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Prevent closing — hide instead
  mainWindow.on('close', (e) => {
    if (!mainWindow?.isDestroyed()) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  registerWindowIPC();

  return mainWindow;
}

function registerWindowIPC() {
  // Drag movement
  let dragOffset = { x: 0, y: 0 };

  ipcMain.on('dino:drag-start', (_event, mouseX: number, mouseY: number) => {
    if (!mainWindow) return;
    const [winX, winY] = mainWindow.getPosition();
    dragOffset = { x: mouseX - winX, y: mouseY - winY };
  });

  ipcMain.on('dino:drag-move', (_event, mouseX: number, mouseY: number) => {
    if (!mainWindow) return;
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;
    mainWindow.setPosition(Math.round(newX), Math.round(newY));
  });

  // Snap to edge
  ipcMain.handle('dino:snap-to-edge', (_event, edge: 'left' | 'right' | 'top' | 'bottom') => {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    const [w, h] = mainWindow.getSize();

    const positions: Record<string, [number, number]> = {
      left: [EDGE_MARGIN, sh - h - EDGE_MARGIN],
      right: [sw - w - EDGE_MARGIN, sh - h - EDGE_MARGIN],
      top: [sw - w - EDGE_MARGIN, EDGE_MARGIN],
      bottom: [sw - w - EDGE_MARGIN, sh - h - EDGE_MARGIN],
    };

    const [x, y] = positions[edge];
    mainWindow.setPosition(Math.round(x), Math.round(y));
  });

  // Get window bounds
  ipcMain.handle('dino:get-bounds', () => {
    return mainWindow?.getBounds();
  });

  // Resize window (for menus/popups)
  ipcMain.handle('dino:resize', (_event, width: number, height: number) => {
    mainWindow?.setSize(Math.round(width), Math.round(height));
  });

  // Reset to dino size
  ipcMain.handle('dino:reset-size', () => {
    mainWindow?.setSize(DINO_WIDTH, DINO_HEIGHT);
  });

  // Set size preset
  ipcMain.handle('dino:set-size-preset', (_event, preset: string) => {
    const size = SIZE_PRESETS[preset];
    if (!size || !mainWindow) return;
    mainWindow.setSize(size[0], size[1]);
  });

  // Get current size
  ipcMain.handle('dino:get-size', () => {
    if (!mainWindow) return null;
    const [w, h] = mainWindow.getSize();
    return { width: w, height: h };
  });

  // Expand window for TODO panel (anchored to current position)
  let savedBounds: { x: number; y: number; w: number; h: number } | null = null;

  ipcMain.handle('dino:expand-for-panel', (_event, panelWidth: number, minHeight: number) => {
    if (!mainWindow) return;
    const [w, h] = mainWindow.getSize();
    const [x, y] = mainWindow.getPosition();
    savedBounds = { x, y, w, h };
    const newW = w + panelWidth;
    const newH = Math.max(h, minHeight);
    // Expand to the left so the dino stays in place
    mainWindow.setBounds({
      x: x - panelWidth,
      y,
      width: newW,
      height: newH,
    });
  });

  ipcMain.handle('dino:collapse-panel', () => {
    if (!mainWindow) return;
    if (savedBounds) {
      mainWindow.setBounds({
        x: savedBounds.x,
        y: savedBounds.y,
        width: savedBounds.w,
        height: savedBounds.h,
      });
      savedBounds = null;
    }
  });

  // Native context menu
  ipcMain.handle('dino:show-context-menu', (_event, items: { label: string; id: string }[]) => {
    if (!mainWindow) return null;

    return new Promise<string | null>((resolve) => {
      const template = items.map((item) => ({
        label: item.label,
        click: () => resolve(item.id),
      }));

      const menu = Menu.buildFromTemplate(template);
      menu.popup({
        window: mainWindow!,
        callback: () => resolve(null),
      });
    });
  });

  // Toggle click-through (for transparent areas)
  ipcMain.handle('dino:set-ignore-mouse', (_event, ignore: boolean, options?: { forward: boolean }) => {
    mainWindow?.setIgnoreMouseEvents(ignore, options);
  });
}
