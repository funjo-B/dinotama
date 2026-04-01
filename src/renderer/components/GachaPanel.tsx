import React, { useCallback } from 'react';
import { GACHA_RATES, SPECIES_POOL, SPECIES_DEFS, PITY_THRESHOLDS } from '@shared/constants';
import type { DinoRarity } from '@shared/types';
import { useDinoStore } from '../stores/dinoStore';

interface GachaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPull: () => void;
}

const RARITY_CONFIG: Record<DinoRarity, { label: string; color: string; stars: string }> = {
  common: { label: 'Common', color: '#9ca3af', stars: '★' },
  rare:   { label: 'Rare',   color: '#60a5fa', stars: '★★' },
  epic:   { label: 'Epic',   color: '#c084fc', stars: '★★★' },
  legend: { label: 'Legend',  color: '#fbbf24', stars: '★★★★' },
};

const RARITY_ORDER: DinoRarity[] = ['legend', 'epic', 'rare', 'common'];

export function GachaPanel({ isOpen, onClose, onPull }: GachaPanelProps) {
  const { coins, gacha } = useDinoStore();

  if (!isOpen) return null;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'rgb(15, 15, 25)',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      fontSize: 12,
      overflow: 'hidden',
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
          🥚 알 뽑기
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#94a3b8',
          cursor: 'pointer', fontSize: 16, padding: '0 2px',
        }}>✕</button>
      </div>

      {/* Coins + Pull button */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <button
          onClick={onPull}
          disabled={coins < 10}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            borderRadius: 8,
            background: coins >= 10
              ? 'linear-gradient(135deg, #fbbf24, #f97316)'
              : 'rgba(255,255,255,0.1)',
            color: coins >= 10 ? '#000' : '#64748b',
            fontSize: 14,
            fontWeight: 700,
            cursor: coins >= 10 ? 'pointer' : 'not-allowed',
          }}
        >
          🥚 뽑기 (💰10)
        </button>
        <div style={{ textAlign: 'right', fontSize: 11 }}>
          <div style={{ color: '#fbbf24', fontWeight: 700 }}>💰 {coins}</div>
        </div>
      </div>

      {/* Pity info */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: 10,
        color: '#64748b',
        display: 'flex',
        gap: 12,
      }}>
        <span>Epic 천장: {gacha.pullsSinceEpic}/{PITY_THRESHOLDS.epic}</span>
        <span>Legend 천장: {gacha.pullsSinceLegend}/{PITY_THRESHOLDS.legend}</span>
      </div>

      {/* Rates + Species list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {RARITY_ORDER.map((rarity) => {
          const config = RARITY_CONFIG[rarity];
          const rate = GACHA_RATES[rarity];
          const species = SPECIES_POOL[rarity];

          return (
            <div key={rarity} style={{ marginBottom: 8 }}>
              {/* Rarity header */}
              <div style={{
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: config.color, fontSize: 11 }}>{config.stars}</span>
                  <span style={{ color: config.color, fontWeight: 700, fontSize: 12 }}>{config.label}</span>
                </div>
                <span style={{
                  color: config.color,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${config.color}15`,
                  padding: '2px 8px',
                  borderRadius: 4,
                }}>
                  {(rate * 100).toFixed(0)}%
                </span>
              </div>

              {/* Species in this rarity */}
              <div style={{ padding: '0 14px 0 28px' }}>
                {species.map((sid) => {
                  const def = SPECIES_DEFS[sid];
                  return (
                    <div key={sid} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: def.baseColor, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                        {def.nameKo}
                      </span>
                      <span style={{ fontSize: 9, color: '#64748b' }}>
                        {def.nameEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 9,
        color: '#475569',
        textAlign: 'center',
      }}>
        총 {gacha.totalPulls}회 뽑기 완료
      </div>
    </div>
  );
}
