import { BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const DINO_WIDTH = 200;
const DINO_HEIGHT = 200;
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

  // Toggle click-through (for transparent areas)
  ipcMain.handle('dino:set-ignore-mouse', (_event, ignore: boolean, options?: { forward: boolean }) => {
    mainWindow?.setIgnoreMouseEvents(ignore, options);
  });
}
