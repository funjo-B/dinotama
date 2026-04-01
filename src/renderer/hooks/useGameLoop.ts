import { useEffect, useRef } from 'react';
import { useDinoStore } from '../stores/dinoStore';
import { decayStats } from '../stores/statDecay';
import { resolveEmotion } from '../stores/emotionEngine';
import { checkEvolution, calculateGrowthPoints } from '../stores/growthFSM';

const TICK_INTERVAL_MS = 60_000; // 1 minute

export function useGameLoop() {
  const lastTick = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick.current;
      lastTick.current = now;

      const state = useDinoStore.getState();
      const { activeDino, activeStats } = state;
      if (!activeDino) return;

      // 1. Decay local stats (not persisted per-dino)
      const newStats = decayStats(activeStats, elapsed);
      state.updateActiveStats(newStats);

      // 2. Resolve emotion from stats
      const emotion = resolveEmotion(newStats);
      if (emotion !== state.activeEmotion) {
        state.setActiveEmotion(emotion);
      }

      // 3. Add growth points and check evolution
      const growth = calculateGrowthPoints(activeDino, newStats);
      const newStage = checkEvolution({ ...activeDino, stageProgress: growth });

      if (newStage) {
        state.evolve(activeDino.id, newStage);
      } else {
        state.updateStageProgress(activeDino.id, growth);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
