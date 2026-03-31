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

  onSyncRequest: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('dino:sync-request', handler);
    return () => ipcRenderer.removeListener('dino:sync-request', handler);
  },
};

contextBridge.exposeInMainWorld('dinoAPI', dinoAPI);

// Type export for renderer
export type DinoAPI = typeof dinoAPI;
