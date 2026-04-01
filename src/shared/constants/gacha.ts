import type { DinoRarity } from '../types';

export const GACHA_RATES: Record<DinoRarity, number> = {
  common: 0.50,
  rare:   0.30,
  epic:   0.15,
  legend: 0.04,
  hidden: 0.01,
};

export const PITY_THRESHOLDS = {
  epic:   50,
  legend: 100,
  hidden: 300,
} as const;

export const STAGE_THRESHOLDS = {
  egg: 0,
  baby: 100,
  teen: 300,
  adult: 600,
} as const;

export const STAT_DECAY_RATE = {
  hunger: 2,      // per hour
  happiness: 1.5, // per hour
  fatigue: 1,     // per hour (increases)
} as const;

export const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const CALENDAR_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
export const NOTIFICATION_BEFORE_MS = 5 * 60 * 1000; // 5 minutes before event
