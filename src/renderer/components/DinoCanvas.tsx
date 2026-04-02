import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoStore } from '../stores/dinoStore';
import { REAL_SPRITE_SPECIES, SPRITE_FRAME_COUNTS, HIDDEN_TRANSFORMS } from '@shared/constants';
import type { DinoEmotion } from '@shared/types';
import type { TargetAndTransition } from 'framer-motion';

const EMOTION_ANIMATIONS: Record<DinoEmotion, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  idle1: {
    // Stretch / yawn
    scale: [1, 1.05, 1.08, 1.02, 1],
    y: [0, -2, -4, -2, 0],
    transition: { duration: 2, repeat: 0, ease: 'easeInOut' },
  },
  idle2: {
    // Look around
    rotate: [0, -8, 0, 8, 0],
    y: [0, -2, 0, -2, 0],
    transition: { duration: 1.8, repeat: 0, ease: 'easeInOut' },
  },
  idle3: {
    // Little hop
    y: [0, -6, 0, -10, 0, -3, 0],
    scale: [1, 1.02, 1, 1.04, 1, 1.01, 1],
    transition: { duration: 1.5, repeat: 0, ease: 'easeInOut' },
  },
  happy: {
    y: [0, -10, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
  },
  sad: {
    y: [0, 2, 0],
    opacity: [1, 0.7, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  hungry: {
    rotate: [-3, 3, -3],
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
  },
  sleepy: {
    y: [0, 2, 0],
    scale: [1, 0.97, 1],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  excited: {
    y: [0, -12, 0, -8, 0],
    rotate: [0, -5, 0, 5, 0],
    transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export function DinoCanvas() {
  const activeDino = useDinoStore((s) => s.activeDino);
  const emotion: DinoEmotion = useDinoStore((s) => s.activeEmotion);

  // 멀티프레임 사이클링
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    if (!activeDino) return;
    const se = emotion.startsWith('idle') ? 'idle' : emotion;
    const frameCount = SPRITE_FRAME_COUNTS[`${activeDino.species}_${se}`] ?? 1;
    if (frameCount <= 1) { setFrame(1); return; }
    setFrame(1);
    const interval = setInterval(() => {
      setFrame((f) => (f % frameCount) + 1);
    }, 200); // 200ms마다 프레임 교체
    return () => clearInterval(interval);
  }, [activeDino?.species, emotion]);

  const frameStr = String(frame).padStart(2, '0');
  // idle variants use 'idle' sprite
  const spriteEmotion = emotion.startsWith('idle') ? 'idle' : emotion;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={emotion}
        animate={EMOTION_ANIMATIONS[emotion]}
        style={{
          width: 128,
          height: 128,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeDino ? (() => {
          // Hidden 종이 adult일 때 변신 폼 스프라이트 사용
          const transform = activeDino.stage === 'adult' ? HIDDEN_TRANSFORMS[activeDino.species] : undefined;
          const spriteFolder = transform?.spriteFolder ?? activeDino.species;
          return (
            <img
              src={`./assets/sprites/${activeDino.stage}/${spriteFolder}/sprite_${activeDino.stage}_${spriteEmotion}_${frameStr}.png`}
              alt={activeDino.name}
              width={128}
              height={128}
              style={{ imageRendering: REAL_SPRITE_SPECIES.has(activeDino.species) ? 'auto' : 'pixelated' }}
              draggable={false}
              onError={(e) => {
                // Fallback to legacy rarity-based sprite
                const fallback = `./assets/sprites/${activeDino.stage}/${activeDino.rarity}/sprite_${activeDino.stage}_${spriteEmotion}_${frameStr}.png`;
                if ((e.target as HTMLImageElement).src !== fallback) {
                  (e.target as HTMLImageElement).src = fallback;
                }
              }}
            />
          );
        })() : (
          <EggPlaceholder />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function EggPlaceholder() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{
        width: 128,
        height: 128,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4ade80, #22c55e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        userSelect: 'none',
      }}
    >
      🥚
    </motion.div>
  );
}
