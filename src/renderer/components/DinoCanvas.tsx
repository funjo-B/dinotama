import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoStore } from '../stores/dinoStore';
import type { DinoEmotion } from '@shared/types';
import type { TargetAndTransition } from 'framer-motion';

const EMOTION_ANIMATIONS: Record<DinoEmotion, TargetAndTransition> = {
  idle: {
    y: [0, -4, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
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
  const emotion: DinoEmotion = activeDino?.emotion ?? 'idle';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={emotion}
        animate={EMOTION_ANIMATIONS[emotion]}
        style={{
          width: 72,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          imageRendering: 'pixelated',
        }}
      >
        {activeDino ? (
          <img
            src={`./assets/sprites/${activeDino.stage}/${activeDino.rarity}/sprite_${activeDino.stage}_${activeDino.emotion}_01.png`}
            alt={activeDino.name}
            width={72}
            height={72}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
        ) : (
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
        width: 72,
        height: 72,
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
