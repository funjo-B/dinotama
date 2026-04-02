import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoStore } from '../stores/dinoStore';
import { getTransformedDef } from '@shared/constants';

interface StatsOverlayProps {
  visible: boolean;
}

export function StatsOverlay({ visible }: StatsOverlayProps) {
  const activeDino = useDinoStore((s) => s.activeDino);
  const activeStats = useDinoStore((s) => s.activeStats);

  if (!activeDino) return null;

  const speciesName = getTransformedDef(activeDino.species, activeDino.stage)?.nameKo ?? activeDino.species;

  const stats = [
    { label: '🍖', value: activeStats.hunger, color: '#f97316' },
    { label: '💛', value: activeStats.happiness, color: '#eab308' },
    { label: '💤', value: 100 - activeStats.fatigue, color: '#8b5cf6' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            position: 'absolute',
            bottom: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
            {activeDino.name} ({speciesName})
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 10 }}>{stat.label}</span>
                <div style={{
                  width: 30,
                  height: 4,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${stat.value}%`,
                    height: '100%',
                    background: stat.color,
                    borderRadius: 2,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
