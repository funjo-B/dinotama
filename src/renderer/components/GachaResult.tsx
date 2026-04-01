import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dino, DinoRarity } from '@shared/types';
import { SPECIES_DEFS } from '@shared/constants';

const RARITY_CONFIG: Record<DinoRarity, { label: string; color: string; bg: string }> = {
  common: { label: '★ Common', color: '#9ca3af', bg: 'rgba(156,163,175,0.2)' },
  rare: { label: '★★ Rare', color: '#60a5fa', bg: 'rgba(96,165,250,0.2)' },
  epic: { label: '★★★ Epic', color: '#c084fc', bg: 'rgba(192,132,252,0.2)' },
  legend: { label: '★★★★ Legend', color: '#fbbf24', bg: 'rgba(251,191,36,0.2)' },
};

interface GachaResultProps {
  dino: Dino | null;
  onClose: () => void;
}

export function GachaResult({ dino, onClose }: GachaResultProps) {
  useEffect(() => {
    if (!dino) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [dino, onClose]);

  return (
    <AnimatePresence>
      {dino && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: RARITY_CONFIG[dino.rarity].bg,
            border: `1px solid ${RARITY_CONFIG[dino.rarity].color}`,
            borderRadius: 10,
            padding: '8px 14px',
            color: '#fff',
            fontSize: 12,
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            zIndex: 9999,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: RARITY_CONFIG[dino.rarity].color, fontWeight: 700, marginBottom: 2 }}>
            {RARITY_CONFIG[dino.rarity].label}
          </div>
          <div>🥚 {SPECIES_DEFS[dino.species]?.nameKo ?? '???'} 획득!</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
