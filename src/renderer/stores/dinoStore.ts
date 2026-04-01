import { create } from 'zustand';
import type { Dino, DinoEmotion, DinoRarity, DinoStage, GachaState, DinoStats } from '@shared/types';
import { GACHA_RATES, PITY_THRESHOLDS } from '@shared/constants';

// Debounced cloud sync — saves after important actions
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function scheduleSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const { syncNow, getCurrentUser } = await import('../services/firebase');
      const user = getCurrentUser();
      if (!user) return;
      const snap = useDinoStore.getState().getSnapshot();
      await syncNow({
        uid: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        ...snap,
        lastSyncTime: Date.now(),
      });
    } catch (err) {
      console.warn('[Sync] Auto-save failed:', err);
    }
  }, 2000); // 2초 디바운스
}

interface DinoStore {
  // State
  dinos: Dino[];
  activeDinoId: string | null;
  activeDino: Dino | null;
  coins: number;
  premiumCurrency: number;
  gacha: GachaState;

  // Actions
  setActiveDino: (id: string) => void;
  updateStats: (id: string, stats: Partial<DinoStats>) => void;
  updateEmotion: (id: string, emotion: DinoEmotion) => void;
  evolve: (id: string, newStage: DinoStage) => void;
  pullGacha: (isPremium: boolean) => Dino | null;
  updateStageProgress: (id: string, progress: number) => void;
  feedDino: (id: string) => void;
  playWithDino: (id: string) => void;
  loadFromCloud: (data: { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState }) => void;
  getSnapshot: () => { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState };
  resetState: () => void;
}

function rollRarity(gacha: GachaState): DinoRarity {
  // Pity system check
  if (gacha.pullsSinceLegend >= PITY_THRESHOLDS.legend) return 'legend';
  if (gacha.pullsSinceEpic >= PITY_THRESHOLDS.epic) return 'epic';

  // Normal roll
  const roll = Math.random();
  let cumulative = 0;

  const rarities: DinoRarity[] = ['legend', 'epic', 'rare', 'common'];
  for (const rarity of rarities) {
    cumulative += GACHA_RATES[rarity];
    if (roll < cumulative) return rarity;
  }
  return 'common';
}

function createDino(rarity: DinoRarity): Dino {
  return {
    id: crypto.randomUUID(),
    name: `Dino-${Date.now().toString(36)}`,
    species: `species_${rarity}`,
    rarity,
    stage: 'egg',
    emotion: 'idle',
    stats: { hunger: 80, happiness: 80, fatigue: 0 },
    birthTime: Date.now(),
    lastFedTime: Date.now(),
    lastPlayTime: Date.now(),
    stageProgress: 0,
  };
}

export const useDinoStore = create<DinoStore>((set, get) => ({
  dinos: [],
  activeDinoId: null,
  activeDino: null,
  coins: 100,
  premiumCurrency: 0,
  gacha: { totalPulls: 0, pullsSinceEpic: 0, pullsSinceLegend: 0 },

  setActiveDino: (id) => {
    const dino = get().dinos.find((d) => d.id === id) ?? null;
    set({ activeDinoId: id, activeDino: dino });
  },

  updateStats: (id, stats) => {
    set((state) => ({
      dinos: state.dinos.map((d) =>
        d.id === id ? { ...d, stats: { ...d.stats, ...stats } } : d
      ),
      activeDino:
        state.activeDinoId === id && state.activeDino
          ? { ...state.activeDino, stats: { ...state.activeDino.stats, ...stats } }
          : state.activeDino,
    }));
  },

  updateEmotion: (id, emotion) => {
    set((state) => ({
      dinos: state.dinos.map((d) => (d.id === id ? { ...d, emotion } : d)),
      activeDino:
        state.activeDinoId === id && state.activeDino
          ? { ...state.activeDino, emotion }
          : state.activeDino,
    }));
  },

  evolve: (id, newStage) => {
    set((state) => ({
      dinos: state.dinos.map((d) =>
        d.id === id ? { ...d, stage: newStage, stageProgress: 0 } : d
      ),
      activeDino:
        state.activeDinoId === id && state.activeDino
          ? { ...state.activeDino, stage: newStage, stageProgress: 0 }
          : state.activeDino,
    }));
    scheduleSync();
  },

  pullGacha: (isPremium) => {
    const state = get();
    const cost = isPremium ? 1 : 10;
    const currency = isPremium ? state.premiumCurrency : state.coins;

    if (currency < cost) return null;

    const rarity = rollRarity(state.gacha);
    const newDino = createDino(rarity);

    const newGacha: GachaState = {
      totalPulls: state.gacha.totalPulls + 1,
      pullsSinceEpic: rarity === 'epic' || rarity === 'legend' ? 0 : state.gacha.pullsSinceEpic + 1,
      pullsSinceLegend: rarity === 'legend' ? 0 : state.gacha.pullsSinceLegend + 1,
    };

    set({
      dinos: [...state.dinos, newDino],
      gacha: newGacha,
      // Always activate the newly pulled dino
      activeDinoId: newDino.id,
      activeDino: newDino,
      ...(isPremium
        ? { premiumCurrency: state.premiumCurrency - cost }
        : { coins: state.coins - cost }),
    });

    scheduleSync();
    return newDino;
  },

  updateStageProgress: (id, progress) => {
    set((state) => ({
      dinos: state.dinos.map((d) =>
        d.id === id ? { ...d, stageProgress: progress } : d
      ),
      activeDino:
        state.activeDinoId === id && state.activeDino
          ? { ...state.activeDino, stageProgress: progress }
          : state.activeDino,
    }));
  },

  feedDino: (id) => {
    const dino = get().dinos.find((d) => d.id === id);
    if (!dino) return;

    const newHunger = Math.min(100, dino.stats.hunger + 20);
    const newHappiness = Math.min(100, dino.stats.happiness + 5);
    get().updateStats(id, { hunger: newHunger, happiness: newHappiness });
    get().updateEmotion(id, 'happy');
    scheduleSync();
  },

  playWithDino: (id) => {
    const dino = get().dinos.find((d) => d.id === id);
    if (!dino) return;

    const newHappiness = Math.min(100, dino.stats.happiness + 15);
    const newFatigue = Math.min(100, dino.stats.fatigue + 10);
    get().updateStats(id, { happiness: newHappiness, fatigue: newFatigue });
    get().updateEmotion(id, 'excited');
    scheduleSync();
  },

  loadFromCloud: (data) => {
    const activeDino = data.activeDinoId
      ? data.dinos.find((d) => d.id === data.activeDinoId) ?? null
      : data.dinos[0] ?? null;
    set({
      dinos: data.dinos,
      activeDinoId: activeDino?.id ?? null,
      activeDino,
      coins: data.coins,
      premiumCurrency: data.premiumCurrency,
      gacha: data.gacha,
    });
    console.log(`[DinoStore] Loaded from cloud: ${data.dinos.length} dinos, ${data.coins} coins`);
  },

  getSnapshot: () => {
    const s = get();
    return {
      dinos: s.dinos,
      activeDinoId: s.activeDinoId,
      coins: s.coins,
      premiumCurrency: s.premiumCurrency,
      gacha: s.gacha,
    };
  },

  resetState: () => {
    set({
      dinos: [],
      activeDinoId: null,
      activeDino: null,
      coins: 100,
      premiumCurrency: 0,
      gacha: { totalPulls: 0, pullsSinceEpic: 0, pullsSinceLegend: 0 },
    });
  },
}));
