import { ipcMain, shell } from 'electron';
import { AD_REWARD_URL } from '../shared/constants/gacha';

const VALIDATE_URL = 'https://us-central1-dinotama-dff44.cloudfunctions.net/validateReward';

export function setupRewardIPC() {
  // Open ad reward page in browser
  ipcMain.handle('dino:open-ad-reward', (_event, uid: string) => {
    const url = `${AD_REWARD_URL}?uid=${encodeURIComponent(uid)}`;
    shell.openExternal(url);
    return true;
  });

  // Validate reward token via Cloud Function
  ipcMain.handle('dino:validate-ad-reward', async (_event, token: string) => {
    try {
      const resp = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await resp.json();
      return data;
    } catch (err: any) {
      console.error('[Reward] Validation failed:', err.message);
      return { valid: false, reason: 'network_error' };
    }
  });
}
