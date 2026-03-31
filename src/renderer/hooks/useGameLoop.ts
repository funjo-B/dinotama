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
      const { activeDino } = state;
      if (!activeDino) return;

      // 1. Decay stats
      const newStats = decayStats(activeDino.stats, elapsed);
      state.updateStats(activeDino.id, newStats);

      // 2. Resolve emotion from stats
      const emotion = resolveEmotion(newStats);
      if (emotion !== activeDino.emotion) {
        state.updateEmotion(activeDino.id, emotion);
      }

      // 3. Add growth points and check evolution
      const growth = calculateGrowthPoints({ ...activeDino, stats: newStats });
      const newStage = checkEvolution({ ...activeDino, stageProgress: growth });

      if (newStage) {
        state.evolve(activeDino.id, newStage);
      } else {
        // Just update progress
        state.updateStageProgress(activeDino.id, growth);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);
}
