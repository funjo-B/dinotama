import type { DinoStage, Dino } from '@shared/types';
import { STAGE_THRESHOLDS } from '@shared/constants';

const STAGE_ORDER: DinoStage[] = ['egg', 'baby', 'teen', 'adult'];

/** Get the next stage, or null if already at max */
export function getNextStage(current: DinoStage): DinoStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

/** Calculate accumulated growth points based on care actions */
export function calculateGrowthPoints(dino: Dino): number {
  const avgStats = (dino.stats.hunger + dino.stats.happiness + (100 - dino.stats.fatigue)) / 3;
  // Higher avg stats = faster growth
  const multiplier = avgStats / 100;
  return dino.stageProgress + multiplier;
}

/** Check if dino should evolve and return new stage if so */
export function checkEvolution(dino: Dino): DinoStage | null {
  const nextStage = getNextStage(dino.stage);
  if (!nextStage) return null;

  const threshold = STAGE_THRESHOLDS[nextStage];
  if (dino.stageProgress >= threshold) {
    return nextStage;
  }
  return null;
}

/** Get stage display name in Korean */
export function getStageName(stage: DinoStage): string {
  const names: Record<DinoStage, string> = {
    egg: '알',
    baby: '유년기',
    teen: '성장기',
    adult: '성숙기',
  };
  return names[stage];
}

/** Get time requirement description for next evolution */
export function getEvolutionInfo(dino: Dino): { nextStage: DinoStage | null; progress: number; threshold: number } {
  const nextStage = getNextStage(dino.stage);
  if (!nextStage) {
    return { nextStage: null, progress: dino.stageProgress, threshold: 0 };
  }
  return {
    nextStage,
    progress: dino.stageProgress,
    threshold: STAGE_THRESHOLDS[nextStage],
  };
}
