import type { DinoAPI } from '../../main/preload';

declare global {
  interface Window {
    dinoAPI: DinoAPI;
  }
}

// Augment CSSProperties for Electron-specific properties
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
