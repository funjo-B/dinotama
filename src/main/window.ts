import { BrowserWindow, screen, ipcMain, Menu } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let panelWindow: BrowserWindow | null = null;

const DINO_WIDTH = 320;
const DINO_HEIGHT = 280;
const EDGE_MARGIN = 10;
const PANEL_GAP = 4;

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
    type: 'toolbar',
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

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('close', (e) => {
    if (!mainWindow?.isDestroyed()) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  // Close panel when main window moves
  mainWindow.on('move', () => {
    if (panelWindow && !panelWindow.isDestroyed()) {
      repositionPanel();
    }
  });

  registerWindowIPC(isDev);

  return mainWindow;
}

function repositionPanel() {
  if (!mainWindow || !panelWindow || panelWindow.isDestroyed()) return;
  const [dinoX, dinoY] = mainWindow.getPosition();
  const [pw] = panelWindow.getSize();
  panelWindow.setPosition(dinoX - pw - PANEL_GAP, dinoY);
}

function registerWindowIPC(isDev: boolean) {
  let dragOffset = { x: 0, y: 0 };

  ipcMain.on('dino:drag-start', (_event, mouseX: number, mouseY: number) => {
    if (!mainWindow) return;
    const [winX, winY] = mainWindow.getPosition();
    dragOffset = { x: mouseX - winX, y: mouseY - winY };
  });

  ipcMain.on('dino:drag-move', (_event, mouseX: number, mouseY: number) => {
    if (!mainWindow) return;
    mainWindow.setPosition(Math.round(mouseX - dragOffset.x), Math.round(mouseY - dragOffset.y));
  });

  ipcMain.handle('dino:get-bounds', () => mainWindow?.getBounds());
  ipcMain.handle('dino:resize', (_event, w: number, h: number) => mainWindow?.setSize(Math.round(w), Math.round(h)));
  ipcMain.handle('dino:reset-size', () => mainWindow?.setSize(DINO_WIDTH, DINO_HEIGHT));

  // ─── Open/close panel as separate window next to dino ───

  ipcMain.handle('dino:open-panel', (_event, panel: string) => {
    if (!mainWindow) return;

    // Toggle: if same panel is open, close it
    if (panelWindow && !panelWindow.isDestroyed()) {
      const currentHash = panelWindow.webContents.getURL();
      if (currentHash.includes(`#panel-${panel}`)) {
        panelWindow.close();
        panelWindow = null;
        return;
      }
      // Different panel requested — close old, open new
      panelWindow.close();
      panelWindow = null;
    }

    const [dinoX, dinoY] = mainWindow.getPosition();
    const panelWidth = panel === 'collection' ? 300 : panel === 'gacha' ? 260 : 260;
    const panelHeight = panel === 'gacha' ? 450 : 400;

    panelWindow = new BrowserWindow({
      width: panelWidth,
      height: panelHeight,
      x: dinoX - panelWidth - PANEL_GAP,
      y: dinoY,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    panelWindow.setAlwaysOnTop(true, 'screen-saver');

    if (isDev) {
      const port = process.env.VITE_DEV_PORT || '5173';
      panelWindow.loadURL(`http://localhost:${port}#panel-${panel}`);
    } else {
      panelWindow.loadFile(path.join(__dirname, '../../renderer/index.html'), {
        hash: `panel-${panel}`,
      });
    }

    panelWindow.on('closed', () => {
      panelWindow = null;
      // Notify main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('dino:panel-closed');
      }
    });
  });

  ipcMain.handle('dino:close-panel', () => {
    if (panelWindow && !panelWindow.isDestroyed()) {
      panelWindow.close();
      panelWindow = null;
    }
  });

  // ─── Sync dino data from main window to panel ───

  ipcMain.handle('dino:get-store-snapshot', () => {
    // Request snapshot from main window
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    return mainWindow.webContents.executeJavaScript(
      `JSON.parse(JSON.stringify(window.__dinoStoreSnapshot?.() ?? null))`
    );
  });

  // Panel sends actions back to main window
  ipcMain.on('dino:panel-action', (_event, action: string, ...args: any[]) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('dino:panel-action', action, ...args);
  });

  // Reset position
  ipcMain.handle('dino:reset-position', () => {
    if (!mainWindow) return;
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(sw - DINO_WIDTH - EDGE_MARGIN, sh - DINO_HEIGHT - EDGE_MARGIN);
  });

  // Save / restore position
  let savedPosition: { x: number; y: number } | null = null;

  ipcMain.handle('dino:save-position', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    savedPosition = { x, y };
    return true;
  });

  ipcMain.handle('dino:restore-position', () => {
    if (!mainWindow || !savedPosition) return false;
    mainWindow.setPosition(savedPosition.x, savedPosition.y);
    return true;
  });

  ipcMain.handle('dino:has-saved-position', () => !!savedPosition);

  // Native context menu
  interface NativeMenuItem {
    label: string;
    id: string;
    type?: 'normal' | 'separator';
    submenu?: NativeMenuItem[];
  }

  ipcMain.handle('dino:show-context-menu', (_event, items: NativeMenuItem[]) => {
    if (!mainWindow) return null;
    return new Promise<string | null>((resolve) => {
      function buildTemplate(menuItems: NativeMenuItem[]): Electron.MenuItemConstructorOptions[] {
        return menuItems.map((item) => {
          if (item.type === 'separator') return { type: 'separator' as const };
          if (item.submenu) return { label: item.label, submenu: buildTemplate(item.submenu) };
          return { label: item.label, click: () => resolve(item.id) };
        });
      }
      const menu = Menu.buildFromTemplate(buildTemplate(items));
      menu.popup({ window: mainWindow!, callback: () => resolve(null) });
    });
  });

  ipcMain.handle('dino:set-ignore-mouse', (_event, ignore: boolean, options?: { forward: boolean }) => {
    mainWindow?.setIgnoreMouseEvents(ignore, options);
  });
}
