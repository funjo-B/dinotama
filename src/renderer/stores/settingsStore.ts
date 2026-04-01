import { create } from 'zustand';

export type AppLanguage = 'ko' | 'en';
export type AlarmInterval = 0 | 15 | 30 | 60 | 120; // 0 = 꺼짐

interface SettingsState {
  language: AppLanguage;
  alarmIntervalMin: AlarmInterval;
  backgroundVisible: boolean;
  setLanguage: (lang: AppLanguage) => void;
  setAlarmInterval: (min: AlarmInterval) => void;
  setBackgroundVisible: (on: boolean) => void;
}

const SETTINGS_KEY = 'dinotama-settings';

function loadSettings(): { language: AppLanguage; alarmIntervalMin: AlarmInterval; backgroundVisible: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { language: 'ko', alarmIntervalMin: 30, backgroundVisible: false };
    const parsed = JSON.parse(raw);
    return {
      language: parsed.language === 'en' ? 'en' : 'ko',
      alarmIntervalMin: ([0, 15, 30, 60, 120] as AlarmInterval[]).includes(parsed.alarmIntervalMin)
        ? parsed.alarmIntervalMin
        : 30,
      backgroundVisible: parsed.backgroundVisible === true,
    };
  } catch {
    return { language: 'ko', alarmIntervalMin: 30, backgroundVisible: false };
  }
}

function persistSettings(state: { language: AppLanguage; alarmIntervalMin: AlarmInterval; backgroundVisible: boolean }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
}

const saved = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  language: saved.language,
  alarmIntervalMin: saved.alarmIntervalMin,
  backgroundVisible: saved.backgroundVisible,

  setLanguage: (language) => {
    set((s) => {
      persistSettings({ language, alarmIntervalMin: s.alarmIntervalMin, backgroundVisible: s.backgroundVisible });
      return { language };
    });
  },

  setAlarmInterval: (alarmIntervalMin) => {
    set((s) => {
      persistSettings({ language: s.language, alarmIntervalMin, backgroundVisible: s.backgroundVisible });
      return { alarmIntervalMin };
    });
  },

  setBackgroundVisible: (backgroundVisible) => {
    set((s) => {
      persistSettings({ language: s.language, alarmIntervalMin: s.alarmIntervalMin, backgroundVisible });
      return { backgroundVisible };
    });
  },
}));

// 다른 BrowserWindow(설정 패널 등)에서 localStorage가 바뀌면 이 창의 store도 동기화
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'dinotama-settings') return;
    const fresh = loadSettings();
    useSettingsStore.setState({ language: fresh.language, alarmIntervalMin: fresh.alarmIntervalMin, backgroundVisible: fresh.backgroundVisible });
  });
}
