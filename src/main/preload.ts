import { contextBridge, ipcRenderer } from 'electron';

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
  setSizePreset: (preset: string) => ipcRenderer.invoke('dino:set-size-preset', preset),
  getSize: () => ipcRenderer.invoke('dino:get-size') as Promise<{ width: number; height: number } | null>,
  expandForPanel: (panelWidth: number, minHeight: number) =>
    ipcRenderer.invoke('dino:expand-for-panel', panelWidth, minHeight),
  collapsePanel: () => ipcRenderer.invoke('dino:collapse-panel'),
  showContextMenu: (items: { label: string; id: string }[]) =>
    ipcRenderer.invoke('dino:show-context-menu', items) as Promise<string | null>,

  // Auth (Google login → Firebase + Calendar)
  authLogin: () => ipcRenderer.invoke('dino:auth-login'),
  authLogout: () => ipcRenderer.invoke('dino:auth-logout'),
  authStatus: () => ipcRenderer.invoke('dino:auth-status'),

  // Calendar
  calendarToday: () => ipcRenderer.invoke('dino:calendar-today') as Promise<
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
