import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  items: { label: string; action: () => void }[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        background: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 8,
        padding: 4,
        minWidth: 140,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        backdropFilter: 'blur(10px)',
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => { item.action(); onClose(); }}
          style={{
            padding: '6px 12px',
            color: '#fff',
            fontSize: 12,
            cursor: 'pointer',
            borderRadius: 4,
            userSelect: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
