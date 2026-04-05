import React, { useCallback, useState } from 'react';
import { GACHA_RATES, SPECIES_POOL, SPECIES_DEFS, PITY_THRESHOLDS, AD_REWARD_MAX_DAILY } from '@shared/constants';
import type { DinoRarity } from '@shared/types';
import { useDinoStore } from '../stores/dinoStore';
import { useT, useSpeciesName } from '../hooks/useT';
import { CoinHistoryPanel } from './CoinHistoryPanel';

interface GachaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPull: (count: number) => void;
  userUid?: string | null;
}

const RARITY_CONFIG: Record<DinoRarity, { label: string; color: string; stars: string }> = {
  common: { label: 'Common', color: '#9ca3af', stars: '★'    },
  rare:   { label: 'Rare',   color: '#60a5fa', stars: '★★'   },
  epic:   { label: 'Epic',   color: '#c084fc', stars: '★★★'  },
  legend: { label: 'Legend', color: '#fbbf24', stars: '★★★★' },
  hidden: { label: 'Hidden', color: '#ff6b6b', stars: '✦'    },
};

const RARITY_ORDER: DinoRarity[] = ['hidden', 'legend', 'epic', 'rare', 'common'];

export function GachaPanel({ isOpen, onClose, onPull, userUid }: GachaPanelProps) {
  const t = useT();
  const getSpeciesName = useSpeciesName();
  const { coins, gacha, adRewardUsedToday, lastAdRewardDate } = useDinoStore();

  const today = new Date().toISOString().slice(0, 10);
  const adUsedToday = lastAdRewardDate === today ? adRewardUsedToday : 0;
  const adRemaining = AD_REWARD_MAX_DAILY - adUsedToday;
  const canWatchAd = !!userUid && adRemaining > 0;

  const [historyOpen, setHistoryOpen] = useState(false);

  const handleAdReward = useCallback(() => {
    if (!userUid || !canWatchAd) return;
    window.dinoAPI?.openAdReward?.(userUid);
  }, [userUid, canWatchAd]);

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
          {t.gachaPanel.title}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#94a3b8',
          cursor: 'pointer', fontSize: 16, padding: '0 2px',
        }}>✕</button>
      </div>

      {/* Coins + Pull buttons */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 11 }}>💰 {coins}</span>
          <button
            onClick={() => setHistoryOpen(true)}
            style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 4,
              color: '#fbbf24',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '1px 6px',
              lineHeight: 1.4,
            }}
          >+</button>
        </div>
        {historyOpen && <CoinHistoryPanel onClose={() => setHistoryOpen(false)} />}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onPull(1)}
            disabled={coins < 10}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: 8,
              background: coins >= 10
                ? 'linear-gradient(135deg, #fbbf24, #f97316)'
                : 'rgba(255,255,255,0.1)',
              color: coins >= 10 ? '#000' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: coins >= 10 ? 'pointer' : 'not-allowed',
            }}
          >
            {t.gachaPanel.pull1}
          </button>
          <button
            onClick={() => onPull(5)}
            disabled={coins < 50}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: 8,
              background: coins >= 50
                ? 'linear-gradient(135deg, #60a5fa, #6366f1)'
                : 'rgba(255,255,255,0.1)',
              color: coins >= 50 ? '#fff' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: coins >= 50 ? 'pointer' : 'not-allowed',
            }}
          >
            {t.gachaPanel.pull5}
          </button>
          <button
            onClick={() => onPull(10)}
            disabled={coins < 100}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: 8,
              background: coins >= 100
                ? 'linear-gradient(135deg, #c084fc, #ec4899)'
                : 'rgba(255,255,255,0.1)',
              color: coins >= 100 ? '#fff' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              cursor: coins >= 100 ? 'pointer' : 'not-allowed',
              lineHeight: 1.3,
            }}
          >
            {t.gachaPanel.pull10}<br />💰100
          </button>
        </div>

        {/* Ad Reward Button */}
        <button
          onClick={handleAdReward}
          disabled={!canWatchAd}
          style={{
            width: '100%',
            padding: '9px 0',
            border: '1px dashed',
            borderColor: canWatchAd ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            background: canWatchAd
              ? 'rgba(96, 165, 250, 0.1)'
              : 'rgba(255,255,255,0.03)',
            color: canWatchAd ? '#60a5fa' : '#475569',
            fontSize: 11,
            fontWeight: 600,
            cursor: canWatchAd ? 'pointer' : 'not-allowed',
            marginTop: 6,
          }}
        >
          {!userUid
            ? t.gachaPanel.adRewardLogin
            : adRemaining > 0
              ? `${t.gachaPanel.adReward}  (${t.gachaPanel.adRewardRemaining(adRemaining)})`
              : t.gachaPanel.adRewardDone
          }
        </button>

        {/* Shop Button */}
        <button
          onClick={() => window.dinoAPI?.openPanel?.('shop')}
          style={{
            width: '100%',
            padding: '9px 0',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15))',
            color: '#fbbf24',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          🛒 {t.shop.title}
        </button>
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
        <span>{t.gachaPanel.epicPity(gacha.pullsSinceEpic, PITY_THRESHOLDS.epic)}</span>
        <span>{t.gachaPanel.legendPity(gacha.pullsSinceLegend, PITY_THRESHOLDS.legend)}</span>
        <span style={{ color: '#ff6b6b' }}>{t.gachaPanel.hiddenPity(gacha.pullsSinceHidden ?? 0, PITY_THRESHOLDS.hidden)}</span>
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
                {rarity === 'hidden' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#ff6b6b', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
                      ???
                    </span>
                  </div>
                ) : species.map((sid) => {
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
                        background: config.color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                        {getSpeciesName(def)}
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
        {t.gachaPanel.totalPulls(gacha.totalPulls)}
      </div>
    </div>
  );
}
