import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dino, DinoRarity } from '@shared/types';
import { SPECIES_DEFS } from '@shared/constants';

interface GachaAnimationProps {
  dino: Dino | null;
  onComplete: () => void;
}

const RARITY_COLORS: Record<DinoRarity, string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#c084fc',
  legend: '#fbbf24',
};

const RARITY_LABELS: Record<DinoRarity, string> = {
  common: '★ Common',
  rare: '★★ Rare',
  epic: '★★★ Epic',
  legend: '★★★★ Legend',
};

type Phase = 'shake' | 'crack' | 'reveal';

export function GachaAnimation({ dino, onComplete }: GachaAnimationProps) {
  const [phase, setPhase] = useState<Phase>('shake');

  useEffect(() => {
    if (!dino) return;
    setPhase('shake');
  }, [dino]);

  if (!dino) return null;

  const color = RARITY_COLORS[dino.rarity];
  const speciesName = SPECIES_DEFS[dino.species]?.nameKo ?? dino.species;

  const handleClick = () => {
    if (phase === 'reveal') onComplete();
    else setPhase('reveal');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 20000,
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      <AnimatePresence mode="wait">
        {/* Phase 1: Egg shaking */}
        {phase === 'shake' && (
          <motion.div
            key="shake"
            animate={{
              rotate: [-5, 5, -8, 8, -12, 12, -5, 5, 0],
              scale: [1, 1.02, 1, 1.03, 1, 1.05, 1],
            }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              fontSize: 48,
              textAlign: 'center',
              filter: `drop-shadow(0 0 12px ${color})`,
            }}
          >
            🥚
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}
            >
              클릭하여 열기
            </motion.div>
          </motion.div>
        )}

        {/* Phase 2: Crack */}
        {phase === 'crack' && (
          <motion.div
            key="crack"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 0.8, 1.5, 0] }}
            transition={{ duration: 0.6, ease: 'easeIn' }}
            style={{
              fontSize: 48,
              textAlign: 'center',
              filter: `drop-shadow(0 0 20px ${color})`,
            }}
          >
            💥
          </motion.div>
        )}

        {/* Phase 3: Reveal */}
        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}33, transparent 70%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`./assets/sprites/egg/${dino.species}/sprite_egg_idle_01.png`}
                width={56}
                height={56}
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </motion.div>

            {/* Rarity badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                color,
                fontWeight: 700,
                fontSize: 13,
                textShadow: `0 0 10px ${color}`,
              }}
            >
              {RARITY_LABELS[dino.rarity]}
            </motion.div>

            {/* Species name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}
            >
              {speciesName}
            </motion.div>

            {/* Tap to close hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ delay: 1, duration: 2, repeat: Infinity }}
              style={{ color: '#64748b', fontSize: 9, marginTop: 8 }}
            >
              탭하여 닫기
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
