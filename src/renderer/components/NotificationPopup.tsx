import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '../hooks/useT';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  timeUntilMs: number;
  location?: string;
}

interface NotificationPopupProps {
  event: CalendarEvent | null;
  onOk: () => void;
  onSnooze: () => void;
}

export function NotificationPopup({ event, onOk, onSnooze }: NotificationPopupProps) {
  const t = useT();
  if (!event) return null;

  const minutesUntil = Math.ceil(event.timeUntilMs / 60000);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        style={{
          position: 'fixed',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(20, 20, 30, 0.95)',
          borderRadius: 12,
          padding: '12px 16px',
          minWidth: 220,
          maxWidth: 300,
          color: '#fff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 10000,
          WebkitAppRegion: 'no-drag',
        }}
      >
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
          {t.notify.minutesUntil(minutesUntil)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          {event.title}
        </div>
        {event.location && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
            📍 {event.location}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
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
            OK ✓
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
            {t.notify.snooze}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
