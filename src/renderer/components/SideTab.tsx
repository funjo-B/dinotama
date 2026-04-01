import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SideTabProps {
  activePanel: 'none' | 'todo' | 'collection';
  onTodoClick: () => void;
  onCollectionClick: () => void;
}

const PANEL_WIDTHS = { none: 0, todo: 240, collection: 280 };
const CLOSE_DELAY = 350; // match panel exit animation

export function SideTab({ activePanel, onTodoClick, onCollectionClick }: SideTabProps) {
  const [tabLeft, setTabLeft] = useState(0);

  useEffect(() => {
    const targetLeft = PANEL_WIDTHS[activePanel];
    if (targetLeft > 0) {
      // Opening: move immediately
      setTabLeft(targetLeft);
    } else {
      // Closing: delay to let panel animation finish
      const timer = setTimeout(() => setTabLeft(0), CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [activePanel]);

  return (
    <div
      style={{
        position: 'fixed',
        left: tabLeft,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'left 0.15s ease',
        zIndex: 10001,
        WebkitAppRegion: 'no-drag',
        userSelect: 'none',
      }}
    >
      {/* TODO tab */}
      <motion.div
        onClick={(e) => { e.stopPropagation(); onTodoClick(); }}
        onMouseDown={(e) => e.stopPropagation()}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: activePanel === 'todo' ? 'rgba(74,222,128,0.15)' : 'rgba(15, 15, 25, 0.9)',
          borderRadius: '0 8px 8px 0',
          padding: '8px 6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderTop: `1px solid ${activePanel === 'todo' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRight: `1px solid ${activePanel === 'todo' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderBottom: `1px solid ${activePanel === 'todo' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderLeft: 'none',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span style={{ fontSize: 12 }}>📋</span>
      </motion.div>

      {/* Collection tab */}
      <motion.div
        onClick={(e) => { e.stopPropagation(); onCollectionClick(); }}
        onMouseDown={(e) => e.stopPropagation()}
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: activePanel === 'collection' ? 'rgba(74,222,128,0.15)' : 'rgba(15, 15, 25, 0.9)',
          borderRadius: '0 8px 8px 0',
          padding: '8px 6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          borderTop: `1px solid ${activePanel === 'collection' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderRight: `1px solid ${activePanel === 'collection' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderBottom: `1px solid ${activePanel === 'collection' ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
          borderLeft: 'none',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span style={{ fontSize: 12 }}>📦</span>
      </motion.div>
    </div>
  );
}
