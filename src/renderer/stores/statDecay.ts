import type { DinoStats } from '@shared/types';
import { STAT_DECAY_RATE } from '@shared/constants';

/**
 * Calculate stat decay based on elapsed time.
 * Called on each tick (typically every minute).
 */
export function decayStats(stats: DinoStats, elapsedMs: number): DinoStats {
  const hours = elapsedMs / (1000 * 60 * 60);

  return {
    hunger: Math.max(0, stats.hunger - STAT_DECAY_RATE.hunger * hours),
    happiness: Math.max(0, stats.happiness - STAT_DECAY_RATE.happiness * hours),
    fatigue: Math.min(100, stats.fatigue + STAT_DECAY_RATE.fatigue * hours),
  };
}
