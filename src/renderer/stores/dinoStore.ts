import { create } from 'zustand';
import type { Dino, DinoEmotion, DinoRarity, DinoSpeciesId, DinoStage, DinoStats, GachaState } from '@shared/types';
import { GACHA_RATES, PITY_THRESHOLDS, SPECIES_POOL, SELL_PRICES } from '@shared/constants';

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
  }, 2000);
}

const DEFAULT_STATS: DinoStats = { hunger: 80, happiness: 80, fatigue: 0 };

interface DinoStore {
  // Persisted state (saved to cloud)
  dinos: Dino[];
  activeDinoId: string | null;
  coins: number;
  premiumCurrency: number;
  gacha: GachaState;
  totalSold: number;

  // Local-only state (not saved)
  activeDino: Dino | null;
  activeStats: DinoStats;
  activeEmotion: DinoEmotion;

  // Actions
  setActiveDino: (id: string) => void;
  updateActiveStats: (stats: Partial<DinoStats>) => void;
  setActiveEmotion: (emotion: DinoEmotion) => void;
  mergeDinos: (species: DinoSpeciesId, stage: DinoStage) => Dino | null;
  pullGacha: (isPremium: boolean) => Dino | null;
  renameDino: (id: string, newName: string) => void;
  sellDino: (id: string) => void;
  loadFromCloud: (data: { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState; totalSold?: number }) => void;
  getSnapshot: () => { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState; totalSold: number };
  resetState: () => void;
}

function rollRarity(gacha: GachaState): DinoRarity {
  if (gacha.pullsSinceLegend >= PITY_THRESHOLDS.legend) return 'legend';
  if (gacha.pullsSinceEpic >= PITY_THRESHOLDS.epic) return 'epic';

  const roll = Math.random();
  let cumulative = 0;
  const rarities: DinoRarity[] = ['legend', 'epic', 'rare', 'common'];
  for (const rarity of rarities) {
    cumulative += GACHA_RATES[rarity];
    if (roll < cumulative) return rarity;
  }
  return 'common';
}

function rollSpecies(rarity: DinoRarity): DinoSpeciesId {
  const pool = SPECIES_POOL[rarity];
  return pool[Math.floor(Math.random() * pool.length)];
}

function migrateDino(dino: any): Dino {
  // Migrate old species format
  let species = dino.species;
  if (typeof species === 'string' && species.startsWith('species_')) {
    const rarityStr = species.replace('species_', '') as DinoRarity;
    const pool = SPECIES_POOL[rarityStr] ?? SPECIES_POOL.common;
    const hash = dino.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    species = pool[hash % pool.length];
  }

  // Strip old fields (stats, emotion, lastFedTime, lastPlayTime)
  return {
    id: dino.id,
    name: dino.name,
    species,
    rarity: dino.rarity,
    stage: dino.stage ?? 'egg',
    birthTime: dino.birthTime ?? Date.now(),
    stageProgress: dino.stageProgress ?? 0,
  };
}

function createDino(rarity: DinoRarity): Dino {
  const species = rollSpecies(rarity);
  return {
    id: crypto.randomUUID(),
    name: `Dino-${Date.now().toString(36)}`,
    species,
    rarity,
    stage: 'egg',
    birthTime: Date.now(),
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
  totalSold: 0,

  // Local-only
  activeStats: { ...DEFAULT_STATS },
  activeEmotion: 'idle',

  setActiveDino: (id) => {
    const dino = get().dinos.find((d) => d.id === id) ?? null;
    set({
      activeDinoId: id,
      activeDino: dino,
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
  },

  updateActiveStats: (stats) => {
    set((state) => ({
      activeStats: { ...state.activeStats, ...stats },
    }));
  },

  setActiveEmotion: (emotion) => {
    set({ activeEmotion: emotion });
  },

  mergeDinos: (species, stage) => {
    const STAGE_ORDER: DinoStage[] = ['egg', 'baby', 'teen', 'adult'];
    const stageIdx = STAGE_ORDER.indexOf(stage);
    if (stageIdx < 0 || stageIdx >= STAGE_ORDER.length - 1) return null; // can't merge adults

    const nextStage = STAGE_ORDER[stageIdx + 1];
    const state = get();
    const candidates = state.dinos.filter((d) => d.species === species && d.stage === stage);
    if (candidates.length < 3) return null;

    // Take first 3, remove 2, evolve 1
    const toRemove = candidates.slice(1, 3).map((d) => d.id);
    const toEvolve = candidates[0];

    const evolved: Dino = { ...toEvolve, stage: nextStage, stageProgress: 0 };
    const newDinos = state.dinos
      .filter((d) => !toRemove.includes(d.id))
      .map((d) => d.id === toEvolve.id ? evolved : d);

    const newActive = state.activeDinoId === toEvolve.id || toRemove.includes(state.activeDinoId ?? '')
      ? evolved
      : state.activeDino;

    set({
      dinos: newDinos,
      activeDinoId: newActive?.id ?? state.activeDinoId,
      activeDino: newActive,
    });
    scheduleSync();
    return evolved;
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
      ...(isPremium
        ? { premiumCurrency: state.premiumCurrency - cost }
        : { coins: state.coins - cost }),
    });

    scheduleSync();
    return newDino;
  },

  renameDino: (id, newName) => {
    const trimmed = newName.trim().slice(0, 20);
    if (!trimmed) return;
    set((state) => {
      const newDinos = state.dinos.map((d) => (d.id === id ? { ...d, name: trimmed } : d));
      const updated = newDinos.find((d) => d.id === id) ?? null;
      return {
        dinos: newDinos,
        activeDino: state.activeDinoId === id ? updated : state.activeDino,
      };
    });
    scheduleSync();
  },

  sellDino: (id) => {
    const state = get();
    const dino = state.dinos.find((d) => d.id === id);
    if (!dino) return;
    if (state.dinos.length <= 1) return; // can't sell last dino

    const price = SELL_PRICES[dino.rarity];
    const newDinos = state.dinos.filter((d) => d.id !== id);

    // If selling active dino, switch to first remaining
    let newActiveDino = state.activeDino;
    let newActiveDinoId = state.activeDinoId;
    if (state.activeDinoId === id) {
      newActiveDino = newDinos[0] ?? null;
      newActiveDinoId = newActiveDino?.id ?? null;
    }

    set({
      dinos: newDinos,
      coins: state.coins + price,
      activeDinoId: newActiveDinoId,
      activeDino: newActiveDino,
      totalSold: state.totalSold + 1,
      ...(newActiveDinoId !== state.activeDinoId ? { activeStats: { ...DEFAULT_STATS }, activeEmotion: 'idle' as DinoEmotion } : {}),
    });
    scheduleSync();
  },

  loadFromCloud: (data) => {
    const migratedDinos = data.dinos.map(migrateDino);
    const activeDino = data.activeDinoId
      ? migratedDinos.find((d) => d.id === data.activeDinoId) ?? null
      : migratedDinos[0] ?? null;
    set({
      dinos: migratedDinos,
      activeDinoId: activeDino?.id ?? null,
      activeDino,
      coins: data.coins,
      premiumCurrency: data.premiumCurrency,
      gacha: data.gacha,
      totalSold: data.totalSold ?? 0,
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
    console.log(`[DinoStore] Loaded from cloud: ${migratedDinos.length} dinos, ${data.coins} coins`);
  },

  getSnapshot: () => {
    const s = get();
    return {
      dinos: s.dinos,
      activeDinoId: s.activeDinoId,
      coins: s.coins,
      premiumCurrency: s.premiumCurrency,
      gacha: s.gacha,
      totalSold: s.totalSold,
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
      totalSold: 0,
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
  },
}));
