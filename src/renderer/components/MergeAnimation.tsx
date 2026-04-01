import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DinoStage, DinoSpeciesId, DinoRarity } from '@shared/types';
import { SPECIES_DEFS } from '@shared/constants';
import { useT, useSpeciesName } from '../hooks/useT';

interface MergeAnimationProps {
  species: DinoSpeciesId | null;
  fromStage: DinoStage | null;
  toStage: DinoStage | null;
  onComplete: () => void;
}

const STAGE_EMOJI: Record<DinoStage, string> = {
  egg: '🥚',
  baby: '🐣',
  teen: '🦕',
  adult: '🦖',
};

type Phase = 'before' | 'flash' | 'after';

export function MergeAnimation({ species, fromStage, toStage, onComplete }: MergeAnimationProps) {
  const t = useT();
  const getSpeciesName = useSpeciesName();
  const [phase, setPhase] = useState<Phase>('before');

  useEffect(() => {
    if (!species || !fromStage || !toStage) return;
    setPhase('before');

    const t1 = setTimeout(() => setPhase('flash'), 1000);
    const t2 = setTimeout(() => setPhase('after'), 1300);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [species, fromStage, toStage]);

  if (!species || !fromStage || !toStage) return null;

  const def = SPECIES_DEFS[species];
  const color = def?.baseColor ?? '#fff';

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
        cursor: phase === 'after' ? 'pointer' : 'default',
      }}
      onClick={() => { if (phase === 'after') onComplete(); }}
    >
      <AnimatePresence mode="wait">
        {/* Before: 3 eggs merging */}
        {phase === 'before' && (
          <motion.div
            key="before"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: (i - 1) * 30, opacity: 1 }}
                  animate={{ x: 0, opacity: 1, scale: [1, 0.9, 1] }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  style={{ fontSize: 32 }}
                >
                  <img
                    src={`./assets/sprites/${fromStage}/${species}/sprite_${fromStage}_idle_01.png`}
                    width={40}
                    height={40}
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.textContent = STAGE_EMOJI[fromStage];
                    }}
                  />
                </motion.div>
              ))}
            </div>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 10, color: '#94a3b8' }}
            >
              {t.merge.merging}
            </motion.div>
          </motion.div>
        )}

        {/* Flash */}
        {phase === 'flash' && (
          <motion.div
            key="flash"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.3 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}, transparent)`,
            }}
          />
        )}

        {/* After: evolved dino */}
        {phase === 'after' && (
          <motion.div
            key="after"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], filter: [`drop-shadow(0 0 8px ${color})`, `drop-shadow(0 0 20px ${color})`, `drop-shadow(0 0 8px ${color})`] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img
                src={`./assets/sprites/${toStage}/${species}/sprite_${toStage}_idle_01.png`}
                width={64}
                height={64}
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.textContent = STAGE_EMOJI[toStage];
                }}
              />
            </motion.div>
            <div style={{ color, fontWeight: 700, fontSize: 13 }}>
              {t.merge.success}
            </div>
            <div style={{ color: '#fff', fontSize: 12 }}>
              {getSpeciesName(def, species)} → {STAGE_EMOJI[toStage]} {t.merge.stageLabel[toStage]}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ delay: 0.5, duration: 2, repeat: Infinity }}
              style={{ color: '#64748b', fontSize: 9, marginTop: 4 }}
            >
              {t.merge.clickToClose}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
