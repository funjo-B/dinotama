import { create } from 'zustand';
import type { Dino, DinoEmotion, DinoRarity, DinoSpeciesId, DinoStage, DinoStats, GachaState, CoinTransaction, CoinTxType, AttendanceState } from '@shared/types';
import { GACHA_RATES, PITY_THRESHOLDS, SPECIES_POOL, SELL_PRICES, STAGE_SELL_MULTIPLIER, SPECIES_DEFS, AD_REWARD_COINS, getTransformedDef } from '@shared/constants';

// Debounced cloud sync — saves after important actions
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSyncCount = 0; // Track if there are unsaved local changes

function scheduleSync() {
  pendingSyncCount++;
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
      pendingSyncCount = 0;
    } catch (err) {
      console.warn('[Sync] Auto-save failed:', err);
    }
  }, 2000);
}

/** Check if there are local changes not yet synced to cloud */
export function hasPendingSync(): boolean {
  return pendingSyncCount > 0;
}

/** Immediate save for critical actions (gacha, sell, reward) */
function syncImmediate() {
  if (syncTimeout) clearTimeout(syncTimeout);
  pendingSyncCount++;
  (async () => {
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
      pendingSyncCount = 0;
    } catch (err) {
      console.warn('[Sync] Immediate save failed, scheduling retry:', err);
      scheduleSync(); // Fallback to deferred sync
    }
  })();
}

const MAX_COIN_HISTORY = 100; // 최근 100건만 보관

const DEFAULT_STATS: DinoStats = { hunger: 80, happiness: 80, fatigue: 0 };

interface DinoStore {
  // Persisted state (saved to cloud)
  dinos: Dino[];
  activeDinoId: string | null;
  coins: number;
  premiumCurrency: number;
  gacha: GachaState;
  totalSold: number;
  coinHistory: CoinTransaction[];
  attendance: AttendanceState;

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
  pullGachaMulti: (count: number, isPremium: boolean) => Dino[];
  addCoinTx: (type: CoinTxType, amount: number, label: string) => void;
  dailyCheckin: () => { coins: number; streak: number; bonus: boolean } | null;
  renameDino: (id: string, newName: string) => void;
  sellDino: (id: string) => void;
  loadFromCloud: (data: { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState; totalSold?: number; coinHistory?: CoinTransaction[]; attendance?: AttendanceState; adRewardUsedToday?: number; lastAdRewardDate?: string }) => void;
  getSnapshot: () => { dinos: Dino[]; activeDinoId: string | null; coins: number; premiumCurrency: number; gacha: GachaState; totalSold: number };
  resetState: () => void;
  // Ad reward
  grantAdReward: () => number; // returns coins granted
  adRewardUsedToday: number;
  lastAdRewardDate: string;
  useAdReward: () => void;
  // 테스트용
  clearAllDinos: () => void;
  generateAllSpecies: () => void;
}

function rollRarity(gacha: GachaState): DinoRarity {
  if ((gacha.pullsSinceHidden ?? 0) >= PITY_THRESHOLDS.hidden) return 'hidden';
  if (gacha.pullsSinceLegend >= PITY_THRESHOLDS.legend) return 'legend';
  if (gacha.pullsSinceEpic >= PITY_THRESHOLDS.epic) return 'epic';

  const roll = Math.random();
  let cumulative = 0;
  const rarities: DinoRarity[] = ['hidden', 'legend', 'epic', 'rare', 'common'];
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

// Old → new species mapping (removed species from v1 10-species system)
const LEGACY_SPECIES_MAP: Record<string, DinoSpeciesId> = {
  raptor:    'dilophosaurus',  // was common carnivore → dilophosaurus (common carnivore)
  trex:      'tyrannosaurus',  // was legend → tyrannosaurus (legend)
  pterodactyl: 'pteranodon',   // was epic flyer → pteranodon (rare flyer)
};

function migrateDino(dino: any): Dino {
  // Migrate old species format (species_XXX string)
  let species = dino.species;
  if (typeof species === 'string' && species.startsWith('species_')) {
    const rarityStr = species.replace('species_', '') as DinoRarity;
    const pool = SPECIES_POOL[rarityStr] ?? SPECIES_POOL.common;
    const hash = dino.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
    species = pool[hash % pool.length];
  }
  // Migrate removed legacy species IDs → new equivalents
  if (species in LEGACY_SPECIES_MAP) {
    species = LEGACY_SPECIES_MAP[species as string];
  }

  // Strip old fields (stats, emotion, lastFedTime, lastPlayTime)
  return {
    id: dino.id,
    name: dino.name,
    species,
    rarity: dino.rarity,
    stage: dino.stage === 'egg' ? 'baby' : (dino.stage ?? 'baby'),  // egg → baby 마이그레이션
    birthTime: dino.birthTime ?? Date.now(),
    stageProgress: dino.stageProgress ?? 0,
  };
}

function createDino(rarity: DinoRarity, speciesOverride?: DinoSpeciesId): Dino {
  const species = speciesOverride ?? rollSpecies(rarity);
  return {
    id: crypto.randomUUID(),
    name: `Dino-${Date.now().toString(36)}`,
    species,
    rarity,
    stage: 'baby',   // 알 단계 제거 — 가챠 결과는 바로 유년기
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
  gacha: { totalPulls: 0, pullsSinceEpic: 0, pullsSinceLegend: 0, pullsSinceHidden: 0 },
  totalSold: 0,
  coinHistory: [],
  attendance: { lastCheckDate: '', streak: 0, totalCheckins: 0 },
  adRewardUsedToday: 0,
  lastAdRewardDate: '',

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

  addCoinTx: (type, amount, label) => {
    const state = get();
    const newBalance = state.coins + amount;
    const tx: CoinTransaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      balance: newBalance,
      label,
      timestamp: Date.now(),
    };
    set({
      coins: newBalance,
      coinHistory: [tx, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
    });
  },

  dailyCheckin: () => {
    const state = get();
    const today = new Date().toISOString().slice(0, 10);
    if (state.attendance.lastCheckDate === today) return null; // Already checked in

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const isConsecutive = state.attendance.lastCheckDate === yesterday;
    const newStreak = isConsecutive ? state.attendance.streak + 1 : 1;

    const baseReward = 10;
    const streakBonus = newStreak >= 5 && newStreak % 5 === 0 ? 10 : 0;
    const totalReward = baseReward + streakBonus;

    const newBalance = state.coins + totalReward;

    const txs: CoinTransaction[] = [];
    txs.push({
      id: crypto.randomUUID(),
      type: 'daily_checkin',
      amount: baseReward,
      balance: state.coins + baseReward,
      label: `출석 ${newStreak}일차`,
      timestamp: Date.now(),
    });
    if (streakBonus > 0) {
      txs.push({
        id: crypto.randomUUID(),
        type: 'streak_bonus',
        amount: streakBonus,
        balance: newBalance,
        label: `${newStreak}일 연속 출석 보너스`,
        timestamp: Date.now(),
      });
    }

    set({
      coins: newBalance,
      attendance: { lastCheckDate: today, streak: newStreak, totalCheckins: state.attendance.totalCheckins + 1 },
      coinHistory: [...txs, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
    });
    syncImmediate();
    return { coins: totalReward, streak: newStreak, bonus: streakBonus > 0 };
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
      pullsSinceEpic: rarity === 'epic' || rarity === 'legend' || rarity === 'hidden' ? 0 : state.gacha.pullsSinceEpic + 1,
      pullsSinceLegend: rarity === 'legend' || rarity === 'hidden' ? 0 : state.gacha.pullsSinceLegend + 1,
      pullsSinceHidden: rarity === 'hidden' ? 0 : (state.gacha.pullsSinceHidden ?? 0) + 1,
    };

    const newCoins = isPremium ? state.coins : state.coins - cost;
    const tx: CoinTransaction = {
      id: crypto.randomUUID(), type: 'gacha', amount: -cost,
      balance: newCoins, label: '1회 뽑기', timestamp: Date.now(),
    };

    set({
      dinos: [...state.dinos, newDino],
      gacha: newGacha,
      coinHistory: [tx, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
      ...(isPremium
        ? { premiumCurrency: state.premiumCurrency - cost }
        : { coins: newCoins }),
    });

    syncImmediate();
    return newDino;
  },

  pullGachaMulti: (count, isPremium) => {
    const state = get();
    const costPer = isPremium ? 1 : 10;
    const totalCost = costPer * count;
    const currency = isPremium ? state.premiumCurrency : state.coins;

    if (currency < totalCost) return [];

    const results: Dino[] = [];
    let gacha = { ...state.gacha };

    for (let i = 0; i < count; i++) {
      const rarity = rollRarity(gacha);
      const dino = createDino(rarity);
      results.push(dino);
      gacha = {
        totalPulls: gacha.totalPulls + 1,
        pullsSinceEpic: rarity === 'epic' || rarity === 'legend' || rarity === 'hidden' ? 0 : gacha.pullsSinceEpic + 1,
        pullsSinceLegend: rarity === 'legend' || rarity === 'hidden' ? 0 : gacha.pullsSinceLegend + 1,
        pullsSinceHidden: rarity === 'hidden' ? 0 : (gacha.pullsSinceHidden ?? 0) + 1,
      };
    }

    const newCoins = isPremium ? state.coins : state.coins - totalCost;
    const tx: CoinTransaction = {
      id: crypto.randomUUID(), type: 'gacha', amount: -totalCost,
      balance: newCoins, label: `${count}연 뽑기`, timestamp: Date.now(),
    };

    set({
      dinos: [...state.dinos, ...results],
      gacha,
      coinHistory: [tx, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
      ...(isPremium
        ? { premiumCurrency: state.premiumCurrency - totalCost }
        : { coins: newCoins }),
    });

    syncImmediate();
    return results;
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

    const price = SELL_PRICES[dino.rarity] * (STAGE_SELL_MULTIPLIER[dino.stage] ?? 1);
    const newDinos = state.dinos.filter((d) => d.id !== id);

    // If selling active dino, switch to first remaining
    let newActiveDino = state.activeDino;
    let newActiveDinoId = state.activeDinoId;
    if (state.activeDinoId === id) {
      newActiveDino = newDinos[0] ?? null;
      newActiveDinoId = newActiveDino?.id ?? null;
    }

    const newCoins = state.coins + price;
    const specName = getTransformedDef(dino.species, dino.stage)?.nameKo ?? dino.species;
    const tx: CoinTransaction = {
      id: crypto.randomUUID(), type: 'sell', amount: price,
      balance: newCoins, label: `${specName} 판매`, timestamp: Date.now(),
    };

    set({
      dinos: newDinos,
      coins: newCoins,
      coinHistory: [tx, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
      activeDinoId: newActiveDinoId,
      activeDino: newActiveDino,
      totalSold: state.totalSold + 1,
      ...(newActiveDinoId !== state.activeDinoId ? { activeStats: { ...DEFAULT_STATS }, activeEmotion: 'idle' as DinoEmotion } : {}),
    });
    syncImmediate();
  },

  loadFromCloud: (data) => {
    // Protect against overwriting unsaved local changes
    if (pendingSyncCount > 0) {
      console.warn('[DinoStore] Skipping cloud load — local changes pending sync');
      return;
    }

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
      gacha: { ...data.gacha, pullsSinceHidden: (data.gacha as any).pullsSinceHidden ?? 0 },
      totalSold: data.totalSold ?? 0,
      coinHistory: (data as any).coinHistory ?? [],
      attendance: (data as any).attendance ?? { lastCheckDate: '', streak: 0, totalCheckins: 0 },
      adRewardUsedToday: (data as any).adRewardUsedToday ?? 0,
      lastAdRewardDate: (data as any).lastAdRewardDate ?? '',
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
    pendingSyncCount = 0; // Cloud data is now the source of truth
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
      coinHistory: s.coinHistory,
      attendance: s.attendance,
      adRewardUsedToday: s.adRewardUsedToday,
      lastAdRewardDate: s.lastAdRewardDate,
    };
  },

  resetState: () => {
    set({
      dinos: [],
      activeDinoId: null,
      activeDino: null,
      coins: 100,
      premiumCurrency: 0,
      gacha: { totalPulls: 0, pullsSinceEpic: 0, pullsSinceLegend: 0, pullsSinceHidden: 0 },
      totalSold: 0,
      coinHistory: [],
      attendance: { lastCheckDate: '', streak: 0, totalCheckins: 0 },
      adRewardUsedToday: 0,
      lastAdRewardDate: '',
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
  },

  // ── 광고 보상 (30코인) ──────────────────────────────────────────────────
  grantAdReward: () => {
    const state = get();
    const reward = AD_REWARD_COINS;
    const newCoins = state.coins + reward;
    const tx: CoinTransaction = {
      id: crypto.randomUUID(), type: 'ad_reward', amount: reward,
      balance: newCoins, label: '광고 시청 보상', timestamp: Date.now(),
    };
    set({
      coins: newCoins,
      coinHistory: [tx, ...state.coinHistory].slice(0, MAX_COIN_HISTORY),
    });
    syncImmediate();
    return reward;
  },

  useAdReward: () => {
    const today = new Date().toISOString().slice(0, 10);
    const state = get();
    const count = state.lastAdRewardDate === today ? state.adRewardUsedToday : 0;
    set({ adRewardUsedToday: count + 1, lastAdRewardDate: today });
  },

  // ── 테스트 전용 ────────────────────────────────────────────────────────────
  clearAllDinos: () => {
    set({
      dinos: [],
      activeDinoId: null,
      activeDino: null,
      activeStats: { ...DEFAULT_STATS },
      activeEmotion: 'idle',
    });
    scheduleSync();
  },

  generateAllSpecies: () => {
    const allSpecies = Object.values(SPECIES_DEFS);
    const newDinos: Dino[] = allSpecies.map((def) => ({
      id: crypto.randomUUID(),
      name: def.nameKo,
      species: def.id,
      rarity: def.rarity,
      stage: 'baby' as DinoStage,
      birthTime: Date.now(),
      stageProgress: 0,
    }));
    const first = newDinos[0] ?? null;
    set((s) => ({
      dinos: [...s.dinos, ...newDinos],
      activeDinoId: s.activeDinoId ?? first?.id ?? null,
      activeDino: s.activeDino ?? first,
    }));
    scheduleSync();
  },

}));
