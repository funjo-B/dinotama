import React from 'react';
import type { CoinTransaction, CoinTxType } from '@shared/types';
import { useDinoStore } from '../stores/dinoStore';
import { useT } from '../hooks/useT';

const TX_ICONS: Record<CoinTxType, string> = {
  gacha: '🥚',
  sell: '💰',
  ad_reward: '📺',
  daily_checkin: '📅',
  streak_bonus: '🔥',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const mon = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${mon}/${day} ${h}:${m}`;
}

interface CoinHistoryPanelProps {
  onClose: () => void;
}

export function CoinHistoryPanel({ onClose }: CoinHistoryPanelProps) {
  const t = useT();
  const { coinHistory, coins } = useDinoStore();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 30000,
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      fontSize: 12,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>
          {t.gachaPanel.coinHistory}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 12 }}>💰 {coins}</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#94a3b8',
            cursor: 'pointer', fontSize: 16, padding: '0 2px',
          }}>✕</button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {coinHistory.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 11 }}>
            {t.gachaPanel.noHistory}
          </div>
        )}
        {coinHistory.map((tx) => (
          <div key={tx.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {TX_ICONS[tx.type] || '💎'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tx.label}
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                {formatTime(tx.timestamp)}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: tx.amount > 0 ? '#4ade80' : '#f87171',
              }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </div>
              <div style={{ fontSize: 9, color: '#64748b' }}>
                잔액 {tx.balance}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
