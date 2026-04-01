import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dino, DinoRarity } from '@shared/types';
import { SPECIES_DEFS, REAL_SPRITE_SPECIES } from '@shared/constants';
import { useT, useSpeciesName } from '../hooks/useT';

interface GachaAnimationProps {
  dino: Dino | null;
  onComplete: () => void;
}

const RARITY_COLORS: Record<DinoRarity, string> = {
  common: '#9ca3af',
  rare:   '#60a5fa',
  epic:   '#c084fc',
  legend: '#fbbf24',
  hidden: '#ff6b6b',
};

const RARITY_LABELS: Record<DinoRarity, string> = {
  common: '★ Common',
  rare:   '★★ Rare',
  epic:   '★★★ Epic',
  legend: '★★★★ Legend',
  hidden: '✦ Hidden',
};

type Phase = 'shake' | 'crack' | 'legend_flash' | 'reveal';

export function GachaAnimation({ dino, onComplete }: GachaAnimationProps) {
  const t = useT();
  const speciesName = useSpeciesName();
  const [phase, setPhase] = useState<Phase>('shake');

  useEffect(() => {
    if (!dino) return;
    setPhase('shake');
  }, [dino]);

  // Auto-advance from legend_flash → reveal after 2s
  useEffect(() => {
    if (phase !== 'legend_flash') return;
    const t = setTimeout(() => setPhase('reveal'), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  if (!dino) return null;

  const color = RARITY_COLORS[dino.rarity];
  const dinoName = speciesName(SPECIES_DEFS[dino.species], dino.species);

  const handleClick = () => {
    if (phase === 'reveal') onComplete();
    else if (phase === 'shake' || phase === 'crack') {
      setPhase(dino.rarity === 'legend' || dino.rarity === 'hidden' ? 'legend_flash' : 'reveal');
    }
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
              filter: 'none',
            }}
          >
            🥚
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}
            >
              {t.gacha.clickToOpen}
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
              filter: 'none',
            }}
          >
            💥
          </motion.div>
        )}

        {/* Phase 2.5: Legend Flash */}
        {phase === 'legend_flash' && (
          <motion.div
            key="legend_flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              pointerEvents: 'none',
            }}
          >
            {/* Background pulse */}
            <motion.div
              animate={{ opacity: [0, 0.35, 0, 0.5, 0, 0.4, 0] }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle, ${color}88 0%, ${color}aa 40%, transparent 70%)`,
              }}
            />
            {/* Burst rays */}
            <motion.div
              animate={{ rotate: [0, 360], opacity: [0, 1, 0.6, 1, 0] }}
              transition={{ duration: 2, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                background: `conic-gradient(from 0deg, transparent 0deg, ${color}44 10deg, transparent 20deg, ${color}44 30deg, transparent 40deg, ${color}44 50deg, transparent 60deg, ${color}44 70deg, transparent 80deg, ${color}44 90deg, transparent 100deg, ${color}44 110deg, transparent 120deg, ${color}44 130deg, transparent 140deg, ${color}44 150deg, transparent 160deg, ${color}44 170deg, transparent 180deg, ${color}44 190deg, transparent 200deg, ${color}44 210deg, transparent 220deg, ${color}44 230deg, transparent 240deg, ${color}44 250deg, transparent 260deg, ${color}44 270deg, transparent 280deg, ${color}44 290deg, transparent 300deg, ${color}44 310deg, transparent 320deg, ${color}44 330deg, transparent 340deg, ${color}44 350deg, transparent 360deg)`,
                borderRadius: '50%',
              }}
            />
            {/* Egg with rarity glow */}
            <motion.div
              animate={{
                scale: [1, 1.15, 0.95, 1.2, 1],
                filter: [
                  `drop-shadow(0 0 8px ${color})`,
                  `drop-shadow(0 0 32px ${color}) drop-shadow(0 0 60px ${color})`,
                  `drop-shadow(0 0 16px ${color})`,
                  `drop-shadow(0 0 48px ${color}) drop-shadow(0 0 80px ${color})`,
                  `drop-shadow(0 0 24px ${color})`,
                ],
              }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ fontSize: 52, zIndex: 1, position: 'relative' }}
            >
              🥚
            </motion.div>
            {/* Rarity text */}
            <motion.div
              animate={{
                opacity: [0, 1, 0.4, 1, 0.4, 1],
                scale: [0.8, 1.1, 1, 1.05, 1],
                textShadow: [
                  `0 0 10px ${color}`,
                  `0 0 30px ${color}, 0 0 60px ${color}`,
                  `0 0 10px ${color}`,
                  `0 0 40px ${color}, 0 0 80px ${color}`,
                  `0 0 20px ${color}`,
                ],
              }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{
                color,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 4,
                zIndex: 1,
                position: 'relative',
              }}
            >
              {RARITY_LABELS[dino.rarity].toUpperCase()}
            </motion.div>
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
            {/* 부화 문구 */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ color: '#94a3b8', fontSize: 11 }}
            >
              {t.gacha.hatched}
            </motion.div>

            {/* Baby dino sprite with glow */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}33, transparent 70%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`./assets/sprites/baby/${dino.species}/sprite_baby_idle_01.png`}
                width={64}
                height={64}
                style={{ imageRendering: REAL_SPRITE_SPECIES.has(dino.species) ? 'auto' : 'pixelated' }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.fontSize = '40px';
                  img.style.display = 'none';
                  img.insertAdjacentText('afterend', '🦕');
                }}
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
              {dinoName}
            </motion.div>

            {/* Tap to close hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ delay: 1, duration: 2, repeat: Infinity }}
              style={{ color: '#64748b', fontSize: 9, marginTop: 8 }}
            >
              {t.gacha.tapToClose}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
