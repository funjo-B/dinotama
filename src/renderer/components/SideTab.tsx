import React from 'react';
import { motion } from 'framer-motion';

interface SideTabProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SideTab({ isOpen, onClick }: SideTabProps) {
  return (
    <motion.div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      whileHover={{ x: isOpen ? 0 : -3 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        right: isOpen ? 240 : 0,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(15, 15, 25, 0.9)',
        borderRadius: '8px 0 0 8px',
        padding: '10px 6px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        border: '1px solid rgba(255,255,255,0.1)',
        borderRight: 'none',
        backdropFilter: 'blur(12px)',
        transition: 'right 0.3s ease',
        zIndex: 10001,
        WebkitAppRegion: 'no-drag',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 14 }}>📋</span>
      <span style={{
        color: '#94a3b8',
        fontSize: 9,
        writingMode: 'vertical-rl',
        letterSpacing: 1,
      }}>
        TODO
      </span>
    </motion.div>
  );
}
