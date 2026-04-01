import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoStore } from '../stores/dinoStore';

interface StatsOverlayProps {
  visible: boolean;
}

export function StatsOverlay({ visible }: StatsOverlayProps) {
  const activeDino = useDinoStore((s) => s.activeDino);

  if (!activeDino) return null;

  const stats = [
    { label: '🍖', value: activeDino.stats.hunger, color: '#f97316' },
    { label: '💛', value: activeDino.stats.happiness, color: '#eab308' },
    { label: '💤', value: 100 - activeDino.stats.fatigue, color: '#8b5cf6' },
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
            whiteSpace: 'nowrap',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            gap: 8,
            backdropFilter: 'blur(8px)',
          }}
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
