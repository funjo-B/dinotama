import { contextBridge, ipcRenderer, clipboard } from 'electron';

const dinoAPI = {
  // Window drag
  dragStart: (mouseX: number, mouseY: number) =>
    ipcRenderer.send('dino:drag-start', mouseX, mouseY),
  dragMove: (mouseX: number, mouseY: number) =>
    ipcRenderer.send('dino:drag-move', mouseX, mouseY),

  // Window control
  snapToEdge: (edge: 'left' | 'right' | 'top' | 'bottom') =>
    ipcRenderer.invoke('dino:snap-to-edge', edge),
  getBounds: () => ipcRenderer.invoke('dino:get-bounds'),
  resize: (w: number, h: number) => ipcRenderer.invoke('dino:resize', w, h),
  resetSize: () => ipcRenderer.invoke('dino:reset-size'),
  setIgnoreMouse: (ignore: boolean, options?: { forward: boolean }) =>
    ipcRenderer.invoke('dino:set-ignore-mouse', ignore, options),
  openPanel: (panel: string) => ipcRenderer.invoke('dino:open-panel', panel),
  closePanel: () => ipcRenderer.invoke('dino:close-panel'),
  getStoreSnapshot: () => ipcRenderer.invoke('dino:get-store-snapshot'),
  sendPanelAction: (action: string, ...args: any[]) => ipcRenderer.send('dino:panel-action', action, ...args),
  onPanelAction: (callback: (action: string, ...args: any[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string, ...args: any[]) => callback(action, ...args);
    ipcRenderer.on('dino:panel-action', handler);
    return () => ipcRenderer.removeListener('dino:panel-action', handler);
  },
  onPanelClosed: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dino:panel-closed', handler);
    return () => ipcRenderer.removeListener('dino:panel-closed', handler);
  },
  resetPosition: () => ipcRenderer.invoke('dino:reset-position'),
  savePosition: () => ipcRenderer.invoke('dino:save-position'),
  restorePosition: () => ipcRenderer.invoke('dino:restore-position') as Promise<boolean>,
  hasSavedPosition: () => ipcRenderer.invoke('dino:has-saved-position') as Promise<boolean>,
  showContextMenu: (items: { label: string; id: string }[]) =>
    ipcRenderer.invoke('dino:show-context-menu', items) as Promise<string | null>,

  // Ad reward
  openAdReward: (uid: string) => ipcRenderer.invoke('dino:open-ad-reward', uid),
  validateAdReward: (token: string) => ipcRenderer.invoke('dino:validate-ad-reward', token) as Promise<{ valid: boolean; pulls?: number; reason?: string }>,
  readClipboard: () => clipboard.readText(),
  clearClipboard: () => clipboard.writeText(''),

  // External links (Stripe checkout 등)
  openExternal: (url: string) => ipcRenderer.invoke('dino:open-external', url),

  // Auth (Google login → Firebase + Calendar)
  authLogin: () => ipcRenderer.invoke('dino:auth-login'),
  authLogout: () => ipcRenderer.invoke('dino:auth-logout'),
  authStatus: () => ipcRenderer.invoke('dino:auth-status'),

  // Calendar
  calendarToday: () => ipcRenderer.invoke('dino:calendar-today') as Promise<
    { id: string; title: string; startTime: string; endTime: string; location?: string }[]
  >,
  calendarDay: (dayOffset: number) => ipcRenderer.invoke('dino:calendar-day', dayOffset) as Promise<
    { id: string; title: string; startTime: string; endTime: string; location?: string }[]
  >,

  // Events from main process
  onDeepLink: (callback: (data: { action: string; params: Record<string, string>; path: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data as any);
    ipcRenderer.on('dino:deep-link', handler);
    return () => ipcRenderer.removeListener('dino:deep-link', handler);
  },

  onCalendarNotify: (callback: (event: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('dino:calendar-notify', handler);
    return () => ipcRenderer.removeListener('dino:calendar-notify', handler);
  },

  onCalendarAuthExpired: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dino:calendar-auth-expired', handler);
    return () => ipcRenderer.removeListener('dino:calendar-auth-expired', handler);
  },

  onAuthSuccess: (callback: (data: { idToken: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data as { idToken: string });
    ipcRenderer.on('dino:auth-success', handler);
    return () => ipcRenderer.removeListener('dino:auth-success', handler);
  },

  onAuthRestored: (callback: (data: { idToken: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data as { idToken: string });
    ipcRenderer.on('dino:auth-restored', handler);
    return () => ipcRenderer.removeListener('dino:auth-restored', handler);
  },

  onAuthLogout: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dino:auth-logout', handler);
    return () => ipcRenderer.removeListener('dino:auth-logout', handler);
  },

  onSyncRequest: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dino:sync-request', handler);
    return () => ipcRenderer.removeListener('dino:sync-request', handler);
  },
};

contextBridge.exposeInMainWorld('dinoAPI', dinoAPI);

// Type export for renderer
export type DinoAPI = typeof dinoAPI;
