import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '../hooks/useT';

interface TodoReminderProps {
  message: string | null;
  onOk: () => void;
  onSnooze: () => void;
}

export function TodoReminder({ message, onOk, onSnooze }: TodoReminderProps) {
  const t = useT();
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        style={{
          position: 'fixed',
          top: 10,
          left: 10,
          right: 10,
          background: 'rgba(20, 20, 30, 0.95)',
          borderRadius: 12,
          padding: '12px 16px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(74, 222, 128, 0.3)',
          zIndex: 10000,
          WebkitAppRegion: 'no-drag',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 11, color: '#4ade80', marginBottom: 4 }}>
          {t.reminder.title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onOk}
            style={{
              flex: 1,
              padding: '6px 0',
              border: 'none',
              borderRadius: 6,
              background: '#4ade80',
              color: '#000',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.reminder.done}
          </button>
          <button
            onClick={onSnooze}
            style={{
              flex: 1,
              padding: '6px 0',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              background: 'transparent',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t.reminder.later}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
