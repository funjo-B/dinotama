import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dino, DinoRarity } from '@shared/types';
import { SPECIES_DEFS } from '@shared/constants';
import { useT, useSpeciesName } from '../hooks/useT';

interface GachaMultiAnimationProps {
  dinos: Dino[];
  onComplete: () => void;
}

const RARITY_COLORS: Record<DinoRarity, string> = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#c084fc',
  legend: '#fbbf24',
};

const RARITY_LABELS: Record<DinoRarity, string> = {
  common: '★',
  rare: '★★',
  epic: '★★★',
  legend: '★★★★',
};

export function GachaMultiAnimation({ dinos, onComplete }: GachaMultiAnimationProps) {
  const t = useT();
  const speciesName = useSpeciesName();
  const [revealed, setRevealedSet] = useState<Set<number>>(new Set());
  const [legendFlashing, setLegendFlashing] = useState<number | null>(null);

  if (dinos.length === 0) return null;

  const allRevealed = revealed.size === dinos.length;

  // Auto-reveal after legend flash
  useEffect(() => {
    if (legendFlashing === null) return;
    const t = setTimeout(() => {
      setRevealedSet((prev) => new Set([...prev, legendFlashing]));
      setLegendFlashing(null);
    }, 2000);
    return () => clearTimeout(t);
  }, [legendFlashing]);

  const revealOne = (i: number) => {
    if (dinos[i].rarity === 'legend') {
      setLegendFlashing(i);
    } else {
      setRevealedSet((prev) => new Set([...prev, i]));
    }
  };

  const revealAll = () => {
    // Flash legends sequentially, reveal others immediately
    const nonLegends = dinos.map((d, i) => i).filter((i) => dinos[i].rarity !== 'legend');
    setRevealedSet(new Set(nonLegends));
    const firstLegend = dinos.findIndex((d) => d.rarity === 'legend');
    if (firstLegend !== -1) {
      setLegendFlashing(firstLegend);
    }
  };

  // 320px window, 8px padding each side = 304px usable
  // 5 cols + 4 gaps(6px) = 5w + 24 = 304 → w = 56px
  const CARD_W = 56;
  const CARD_H = 72;
  const GAP = 6;
  const cols = dinos.length <= 5 ? dinos.length : 5;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 20000,
        gap: 10,
        padding: '8px',
        boxSizing: 'border-box',
      }}
    >
      {/* Title */}
      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>
        {t.multi.title(dinos.length)}
      </div>

      {/* Legend flash overlay */}
      <AnimatePresence>
        {legendFlashing !== null && (
          <motion.div
            key="legend-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ opacity: [0, 0.4, 0, 0.5, 0, 0.4, 0] }}
              transition={{ duration: 2 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, #fbbf2488 0%, #f97316aa 40%, transparent 70%)',
              }}
            />
            <motion.div
              animate={{ rotate: [0, 360], opacity: [0, 1, 0.6, 1, 0] }}
              transition={{ duration: 2, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                background: 'conic-gradient(from 0deg, transparent 0deg, #fbbf2444 10deg, transparent 20deg, #fbbf2444 30deg, transparent 40deg, #fbbf2444 50deg, transparent 60deg, #fbbf2444 70deg, transparent 80deg, #fbbf2444 90deg, transparent 100deg, #fbbf2444 110deg, transparent 120deg, #fbbf2444 130deg, transparent 140deg, #fbbf2444 150deg, transparent 160deg, #fbbf2444 170deg, transparent 180deg, #fbbf2444 190deg, transparent 200deg, #fbbf2444 210deg, transparent 220deg, #fbbf2444 230deg, transparent 240deg, #fbbf2444 250deg, transparent 260deg, #fbbf2444 270deg, transparent 280deg, #fbbf2444 290deg, transparent 300deg, #fbbf2444 310deg, transparent 320deg, #fbbf2444 330deg, transparent 340deg, #fbbf2444 350deg, transparent 360deg)',
                borderRadius: '50%',
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 0.95, 1.25, 1],
                filter: [
                  'drop-shadow(0 0 8px #fbbf24)',
                  'drop-shadow(0 0 40px #fbbf24) drop-shadow(0 0 80px #f97316)',
                  'drop-shadow(0 0 16px #fbbf24)',
                  'drop-shadow(0 0 56px #fbbf24) drop-shadow(0 0 100px #f97316)',
                  'drop-shadow(0 0 24px #fbbf24)',
                ],
              }}
              transition={{ duration: 2 }}
              style={{ fontSize: 56, position: 'relative', zIndex: 1 }}
            >
              🥚
            </motion.div>
            <motion.div
              animate={{
                opacity: [0, 1, 0.4, 1, 0.4, 1],
                scale: [0.8, 1.1, 1, 1.05, 1],
              }}
              transition={{ duration: 2 }}
              style={{
                color: '#fbbf24',
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 4,
                textShadow: '0 0 30px #fbbf24, 0 0 60px #f97316',
                position: 'relative',
                zIndex: 1,
              }}
            >
              ★★★★ LEGEND
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Egg grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${CARD_W}px)`,
        gap: GAP,
      }}>
        {dinos.map((dino, i) => {
          const isOpen = revealed.has(i);
          const isFlashing = legendFlashing === i;
          const color = RARITY_COLORS[dino.rarity];
          const dinoName = speciesName(SPECIES_DEFS[dino.species], dino.species);

          return (
            <div
              key={i}
              onClick={() => !isOpen && !isFlashing && revealOne(i)}
              style={{
                width: CARD_W,
                height: CARD_H,
                cursor: isOpen || isFlashing ? 'default' : 'pointer',
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait">
                {!isOpen && !isFlashing ? (
                  <motion.div
                    key="egg"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.12)',
                      gap: 3,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>🥚</span>
                    <span style={{ fontSize: 7, color: '#64748b' }}>{t.multi.tap}</span>
                  </motion.div>
                ) : isFlashing ? (
                  <motion.div
                    key="flashing"
                    animate={{
                      scale: [1, 1.15, 0.95, 1.2, 1],
                      filter: [
                        'drop-shadow(0 0 4px #fbbf24)',
                        'drop-shadow(0 0 16px #fbbf24)',
                        'drop-shadow(0 0 8px #fbbf24)',
                        'drop-shadow(0 0 20px #fbbf24)',
                        'drop-shadow(0 0 10px #fbbf24)',
                      ],
                    }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(251,191,36,0.15)',
                      borderRadius: 8,
                      border: '1px solid #fbbf2488',
                      fontSize: 24,
                    }}
                  >
                    🥚
                  </motion.div>
                ) : (
                  <motion.div
                    key="revealed"
                    initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                    animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 260 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${color}18`,
                      borderRadius: 8,
                      border: `1px solid ${color}55`,
                      gap: 2,
                      padding: '3px 2px',
                    }}
                  >
                    <img
                      src={`./assets/sprites/baby/${dino.species}/sprite_baby_idle_01.png`}
                      width={32}
                      height={32}
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span style={{ color, fontSize: 8, fontWeight: 700 }}>
                      {RARITY_LABELS[dino.rarity]}
                    </span>
                    <span style={{ color: '#e2e8f0', fontSize: 7, textAlign: 'center', lineHeight: 1.2 }}>
                      {dinoName}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {!allRevealed && (
          <button
            onClick={revealAll}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.multi.revealAll}
          </button>
        )}
        {allRevealed && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onComplete}
            style={{
              padding: '8px 24px',
              border: 'none',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #fbbf24, #f97316)',
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t.multi.close}
          </motion.button>
        )}
      </div>
    </div>
  );
}
