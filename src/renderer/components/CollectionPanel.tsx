import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDinoStore } from '../stores/dinoStore';
import { SPECIES_DEFS, SELL_PRICES, STAGE_SELL_MULTIPLIER } from '@shared/constants';
import type { Dino, DinoStage, DinoSpeciesId } from '@shared/types';
import { MergeAnimation } from './MergeAnimation';
import { useT, useSpeciesName } from '../hooks/useT';

interface DinoGroup {
  species: DinoSpeciesId;
  stage: DinoStage;
  dinos: Dino[];
}

interface CollectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, payload?: unknown) => void;
}

export function CollectionPanel({ isOpen, onClose, onAction }: CollectionPanelProps) {
  const t = useT();
  const getSpeciesName = useSpeciesName();
  const { dinos, activeDinoId, coins, totalSold } = useDinoStore();
  const setActiveDino = useDinoStore((s) => s.setActiveDino);
  const sellDino = useDinoStore((s) => s.sellDino);
  const renameDino = useDinoStore((s) => s.renameDino);

  const [stageFilter, setStageFilter] = useState<DinoStage | 'all'>('all');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ dino: Dino; x: number; y: number } | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [mergeAnim, setMergeAnim] = useState<{ species: DinoSpeciesId; from: DinoStage; to: DinoStage } | null>(null);

  const filtered = useMemo(() => {
    return stageFilter === 'all' ? dinos : dinos.filter((d) => d.stage === stageFilter);
  }, [dinos, stageFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, DinoGroup>();
    for (const dino of filtered) {
      const key = `${dino.species}_${dino.stage}`;
      if (!map.has(key)) {
        map.set(key, { species: dino.species, stage: dino.stage, dinos: [] });
      }
      map.get(key)!.dinos.push(dino);
    }
    // Sort: legend first, then by species name
    const rarityOrder: Record<string, number> = { hidden: 0, legend: 1, epic: 2, rare: 3, common: 4 };
    return Array.from(map.values()).sort((a, b) => {
      const ra = rarityOrder[SPECIES_DEFS[a.species]?.rarity ?? 'common'];
      const rb = rarityOrder[SPECIES_DEFS[b.species]?.rarity ?? 'common'];
      if (ra !== rb) return ra - rb;
      return a.species.localeCompare(b.species);
    });
  }, [filtered]);

  const handleGroupClick = useCallback((key: string) => {
    setExpandedGroup((prev) => (prev === key ? null : key));
    setContextMenu(null);
  }, []);

  const handleDinoContext = useCallback((e: React.MouseEvent, dino: Dino) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ dino, x: e.clientX - rect.left, y: e.clientY - rect.top + 20 });
  }, []);

  const dispatch = useCallback((action: string, ...args: any[]) => {
    if (onAction) {
      onAction(action, ...args);
    } else {
      // Direct call if running in main window
      const store = useDinoStore.getState();
      switch (action) {
        case 'sellDino': store.sellDino(args[0]); break;
        case 'setActiveDino': store.setActiveDino(args[0]); break;
        case 'renameDino': store.renameDino(args[0], args[1]); break;
        case 'clearAllDinos': store.clearAllDinos(); break;
        case 'generateAllSpecies': store.generateAllSpecies(); break;
      }
    }
  }, [onAction]);

  const handleSell = useCallback(() => {
    if (!contextMenu) return;
    dispatch('sellDino', contextMenu.dino.id);
    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleSetActive = useCallback(() => {
    if (!contextMenu) return;
    dispatch('setActiveDino', contextMenu.dino.id);
    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleRenameStart = useCallback(() => {
    if (!contextMenu) return;
    setRenameTarget(contextMenu.dino.id);
    setContextMenu(null);
  }, [contextMenu]);

  const handleRenameSubmit = useCallback((id: string, name: string) => {
    dispatch('renameDino', id, name);
    setRenameTarget(null);
  }, [dispatch]);

  const RARITY_COLORS: Record<string, string> = {
    common: '#9ca3af',
    rare:   '#60a5fa',
    epic:   '#c084fc',
    legend: '#fbbf24',
    hidden: '#ff6b6b',
  };

  if (!isOpen) return null;

  return (
        <div
          onClick={() => setContextMenu(null)}
          style={{
            width: '100%',
            height: '100%',
            background: 'rgb(15, 15, 25)',
            display: 'flex',
            flexDirection: 'column',
            color: '#e2e8f0',
            fontSize: 12,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              {t.collection.title(dinos.length)}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: '#94a3b8',
                cursor: 'pointer', fontSize: 16, padding: '0 2px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Info bar */}
          <div style={{
            padding: '6px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 12,
            fontSize: 11,
            color: '#94a3b8',
          }}>
            <span>💰 {coins}</span>
            <span>{t.collection.sold(totalSold)}</span>
          </div>

          {/* Stage filter */}
          <div style={{
            padding: '8px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: 4,
          }}>
            {(['all', 'baby', 'teen', 'adult'] as const).map((v) => {
              const label = v === 'all' ? t.collection.all : t.collection.stageFilter[v];
              return (
                <button
                  key={v}
                  onClick={() => setStageFilter(v)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    background: stageFilter === v ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                    color: stageFilter === v ? '#4ade80' : '#94a3b8',
                    fontWeight: stageFilter === v ? 700 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Groups */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {groups.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                {t.collection.empty}
              </div>
            )}
            {groups.map((group) => {
              const key = `${group.species}_${group.stage}`;
              const def = SPECIES_DEFS[group.species];
              const expanded = expandedGroup === key;
              const rarityColor = RARITY_COLORS[def?.rarity ?? 'common'];

              return (
                <div key={key}>
                  {/* Group header */}
                  <div
                    onClick={() => handleGroupClick(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      background: expanded ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: def?.baseColor ?? '#888',
                      flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontWeight: 600 }}>
                      {getSpeciesName(def, group.species)}
                    </span>
                    <span style={{ fontSize: 10, color: rarityColor }}>
                      {t.collection.stageLabel[group.stage]}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: group.dinos.length > 1 ? '#4ade80' : '#64748b',
                      minWidth: 24, textAlign: 'right',
                    }}>
                      x{group.dinos.length}
                    </span>
                    {group.dinos.length >= 3 && group.stage !== 'adult' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const STAGE_ORDER: DinoStage[] = ['egg', 'baby', 'teen', 'adult'];
                          const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(group.stage) + 1];
                          if (nextStage) {
                            setMergeAnim({ species: group.species, from: group.stage, to: nextStage });
                          }
                        }}
                        style={{
                          background: 'rgba(251,191,36,0.15)',
                          border: '1px solid rgba(251,191,36,0.4)',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 9,
                          color: '#fbbf24',
                          cursor: 'pointer',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(251,191,36,0.3)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(251,191,36,0.15)')}
                      >
                        {t.collection.merge}
                      </button>
                    )}
                    <span style={{ fontSize: 9, color: '#64748b' }}>
                      {expanded ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Expanded dino list */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {group.dinos.map((dino) => (
                          <div
                            key={dino.id}
                            onContextMenu={(e) => handleDinoContext(e, dino)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '5px 12px 5px 28px',
                              fontSize: 11,
                              cursor: 'pointer',
                              position: 'relative',
                              background: dino.id === activeDinoId ? 'rgba(74,222,128,0.08)' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (dino.id !== activeDinoId) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }}
                            onMouseLeave={(e) => {
                              if (dino.id !== activeDinoId) e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={() => dispatch('setActiveDino', dino.id)}
                          >
                            {dino.id === activeDinoId && (
                              <span style={{ position: 'absolute', left: 14, color: '#4ade80', fontSize: 10 }}>✓</span>
                            )}
                            {renameTarget === dino.id ? (
                              <input
                                autoFocus
                                defaultValue={dino.name}
                                maxLength={20}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubmit(dino.id, (e.target as HTMLInputElement).value);
                                  if (e.key === 'Escape') setRenameTarget(null);
                                }}
                                onBlur={(e) => handleRenameSubmit(dino.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  flex: 1, fontSize: 11, padding: '1px 4px',
                                  background: 'rgba(0,0,0,0.6)', border: '1px solid #4ade80',
                                  borderRadius: 3, color: '#fff', outline: 'none',
                                }}
                              />
                            ) : (
                              <span style={{ flex: 1, color: dino.id === activeDinoId ? '#4ade80' : '#cbd5e1' }}>
                                {dino.name}
                              </span>
                            )}
                            <span style={{ fontSize: 9, color: '#64748b' }}>
                              {t.todo.formatShortDate(new Date(dino.birthTime))}
                            </span>
                          </div>
                        ))}

                        {/* Context menu overlay */}
                        {contextMenu && group.dinos.some((d) => d.id === contextMenu.dino.id) && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              left: contextMenu.x,
                              top: contextMenu.y,
                              background: 'rgba(20,20,35,0.98)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: 6,
                              padding: '4px 0',
                              zIndex: 10002,
                              minWidth: 140,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            }}
                          >
                            <div
                              onClick={handleSetActive}
                              style={ctxItemStyle}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              {t.collection.setActive}
                            </div>
                            <div
                              onClick={handleRenameStart}
                              style={ctxItemStyle}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              {t.collection.rename}
                            </div>
                            {dinos.length > 1 && (
                              <div
                                onClick={handleSell}
                                style={{ ...ctxItemStyle, color: '#f87171' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                {t.collection.sell(SELL_PRICES[contextMenu.dino.rarity] * (STAGE_SELL_MULTIPLIER[contextMenu.dino.stage] ?? 1))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 테스트 도구 */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 6,
            flexShrink: 0,
          }}>
            <button
              onClick={() => {
                if (window.confirm('보유한 공룡을 모두 삭제할까요?')) {
                  dispatch('clearAllDinos');
                }
              }}
              style={{
                flex: 1,
                padding: '6px 0',
                border: '1px solid rgba(248,113,113,0.4)',
                borderRadius: 6,
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🗑️ 전체 삭제
            </button>
            <button
              onClick={() => dispatch('generateAllSpecies')}
              style={{
                flex: 1,
                padding: '6px 0',
                border: '1px solid rgba(96,165,250,0.4)',
                borderRadius: 6,
                background: 'rgba(96,165,250,0.08)',
                color: '#60a5fa',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🧬 전종 생성
            </button>
          </div>

          {/* Merge animation overlay */}
          <MergeAnimation
            species={mergeAnim?.species ?? null}
            fromStage={mergeAnim?.from ?? null}
            toStage={mergeAnim?.to ?? null}
            onComplete={() => {
              if (mergeAnim) {
                dispatch('mergeDinos', mergeAnim.species, mergeAnim.from);
              }
              setMergeAnim(null);
            }}
          />
        </div>
  );
}

const ctxItemStyle: React.CSSProperties = {
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 11,
  whiteSpace: 'nowrap',
};
