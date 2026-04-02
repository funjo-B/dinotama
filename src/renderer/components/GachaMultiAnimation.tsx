import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dino, DinoRarity } from '@shared/types';
import { SPECIES_DEFS, REAL_SPRITE_SPECIES } from '@shared/constants';
import { useT, useSpeciesName } from '../hooks/useT';

interface GachaMultiAnimationProps {
  dinos: Dino[];
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
  common: '★',
  rare:   '★★',
  epic:   '★★★',
  legend: '★★★★',
  hidden: '✦',
};

export function GachaMultiAnimation({ dinos, onComplete }: GachaMultiAnimationProps) {
  const t = useT();
  const speciesName = useSpeciesName();
  const [revealed, setRevealedSet] = useState<Set<number>>(new Set());
  const [legendFlashing, setLegendFlashing] = useState<number | null>(null);

  if (dinos.length === 0) return null;

  const allRevealed = revealed.size === dinos.length;

  const [revealAllPending, setRevealAllPending] = useState(false);

  // Auto-reveal after legend flash
  useEffect(() => {
    if (legendFlashing === null) return;
    const timer = setTimeout(() => {
      setRevealedSet((prev) => {
        const next = new Set([...prev, legendFlashing]);
        // If revealAll was triggered, reveal all remaining after flash
        if (revealAllPending) {
          dinos.forEach((_, i) => next.add(i));
          setRevealAllPending(false);
        }
        return next;
      });
      setLegendFlashing(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [legendFlashing, revealAllPending, dinos]);

  const isSpecial = (rarity: DinoRarity) => rarity === 'legend' || rarity === 'hidden';

  const revealOne = (i: number) => {
    if (legendFlashing !== null) return; // Block clicks during flash
    if (isSpecial(dinos[i].rarity)) {
      setLegendFlashing(i);
    } else {
      setRevealedSet((prev) => new Set([...prev, i]));
    }
  };

  const revealAll = () => {
    if (legendFlashing !== null) return; // Block during flash

    const nonSpecials = dinos.map((_, i) => i).filter((i) => !isSpecial(dinos[i].rarity));
    const firstUnrevealedSpecial = dinos.findIndex((d, i) => isSpecial(d.rarity) && !revealed.has(i));

    if (firstUnrevealedSpecial !== -1) {
      // Flash one special, then reveal everything else after it finishes
      setRevealedSet(new Set([...revealed, ...nonSpecials]));
      setRevealAllPending(true);
      setLegendFlashing(firstUnrevealedSpecial);
    } else {
      // No specials left — reveal all immediately
      setRevealedSet(new Set(dinos.map((_, i) => i)));
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

      {/* Special flash overlay (Legend=gold, Hidden=red) */}
      <AnimatePresence>
        {legendFlashing !== null && (() => {
          const flashDino = dinos[legendFlashing];
          const flashColor = RARITY_COLORS[flashDino.rarity];
          const flashLabel = RARITY_LABELS[flashDino.rarity];
          return (
          <motion.div
            key={`flash-${legendFlashing}`}
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
                background: `radial-gradient(circle, ${flashColor}88 0%, ${flashColor}aa 40%, transparent 70%)`,
              }}
            />
            <motion.div
              animate={{ rotate: [0, 360], opacity: [0, 1, 0.6, 1, 0] }}
              transition={{ duration: 2, ease: 'linear' }}
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                background: `conic-gradient(from 0deg, transparent 0deg, ${flashColor}44 10deg, transparent 20deg, ${flashColor}44 30deg, transparent 40deg, ${flashColor}44 50deg, transparent 60deg, ${flashColor}44 70deg, transparent 80deg, ${flashColor}44 90deg, transparent 100deg, ${flashColor}44 110deg, transparent 120deg, ${flashColor}44 130deg, transparent 140deg, ${flashColor}44 150deg, transparent 160deg, ${flashColor}44 170deg, transparent 180deg, ${flashColor}44 190deg, transparent 200deg, ${flashColor}44 210deg, transparent 220deg, ${flashColor}44 230deg, transparent 240deg, ${flashColor}44 250deg, transparent 260deg, ${flashColor}44 270deg, transparent 280deg, ${flashColor}44 290deg, transparent 300deg, ${flashColor}44 310deg, transparent 320deg, ${flashColor}44 330deg, transparent 340deg, ${flashColor}44 350deg, transparent 360deg)`,
                borderRadius: '50%',
              }}
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 0.95, 1.25, 1],
                filter: [
                  `drop-shadow(0 0 8px ${flashColor})`,
                  `drop-shadow(0 0 40px ${flashColor}) drop-shadow(0 0 80px ${flashColor})`,
                  `drop-shadow(0 0 16px ${flashColor})`,
                  `drop-shadow(0 0 56px ${flashColor}) drop-shadow(0 0 100px ${flashColor})`,
                  `drop-shadow(0 0 24px ${flashColor})`,
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
                color: flashColor,
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 4,
                textShadow: `0 0 30px ${flashColor}, 0 0 60px ${flashColor}`,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {flashLabel} {flashDino.rarity.toUpperCase()}
            </motion.div>
          </motion.div>
          );
        })()}
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
                        `drop-shadow(0 0 4px ${color})`,
                        `drop-shadow(0 0 16px ${color})`,
                        `drop-shadow(0 0 8px ${color})`,
                        `drop-shadow(0 0 20px ${color})`,
                        `drop-shadow(0 0 10px ${color})`,
                      ],
                    }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${color}25`,
                      borderRadius: 8,
                      border: `1px solid ${color}88`,
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
                      style={{ imageRendering: REAL_SPRITE_SPECIES.has(dino.species) ? 'auto' : 'pixelated' }}
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
            disabled={legendFlashing !== null}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 8,
              background: legendFlashing !== null ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
              color: legendFlashing !== null ? '#475569' : '#e2e8f0',
              fontSize: 12,
              fontWeight: 600,
              cursor: legendFlashing !== null ? 'not-allowed' : 'pointer',
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
