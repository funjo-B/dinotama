import React, { useState, useCallback } from 'react';
import { DinoCanvas } from './components/DinoCanvas';
import { StatsOverlay } from './components/StatsOverlay';
import { NotificationPopup } from './components/NotificationPopup';
import { GachaResult } from './components/GachaResult';
import { TodoPanel } from './components/TodoPanel';
import { SideTab } from './components/SideTab';
import { useDrag } from './hooks/useDrag';
import { useContextMenu } from './hooks/useContextMenu';
import { useGameLoop } from './hooks/useGameLoop';
import { useCalendarNotifications } from './hooks/useCalendarNotifications';
import { useAuth } from './hooks/useAuth';
import { useDinoStore } from './stores/dinoStore';
import { getNextStage } from './stores/growthFSM';
import type { Dino } from '@shared/types';

const TODO_PANEL_WIDTH = 240;

const SIZE_LABELS: Record<string, string> = {
  small: '🐣 작게',
  medium: '🦕 보통',
  large: '🦖 크게',
  xlarge: '🐉 아주 크게',
};

export default function App() {
  const [showStats, setShowStats] = useState(false);
  const [gachaResult, setGachaResult] = useState<Dino | null>(null);
  const [todoOpen, setTodoOpen] = useState(false);
  const [currentSize, setCurrentSize] = useState('medium');
  const { user } = useAuth();
  useGameLoop();
  const { onMouseDown } = useDrag();
  const { showMenu } = useContextMenu();
  const { activeDino, feedDino, playWithDino, pullGacha, coins, evolve } = useDinoStore();
  const { currentEvent, handleOk, handleSnooze } = useCalendarNotifications();

  const toggleTodo = useCallback(() => {
    const next = !todoOpen;
    setTodoOpen(next);
    if (window.dinoAPI) {
      if (next) {
        window.dinoAPI.expandForPanel?.(TODO_PANEL_WIDTH, 350);
      } else {
        window.dinoAPI.collapsePanel?.();
      }
    }
  }, [todoOpen]);

  const handleSizeChange = useCallback((preset: string) => {
    window.dinoAPI?.setSizePreset?.(preset);
    setCurrentSize(preset);
  }, []);

  const handleGacha = useCallback(() => {
    const result = pullGacha(false);
    if (result) {
      setGachaResult(result);
    }
  }, [pullGacha]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const nextStage = activeDino ? getNextStage(activeDino.stage) : null;
      const items = [
        ...(activeDino
          ? [
              { label: '🍖 밥 주기', action: () => feedDino(activeDino.id) },
              { label: '🎮 놀아주기', action: () => playWithDino(activeDino.id) },
            ]
          : []),
        ...(activeDino && nextStage
          ? [{ label: `⚡ 진화! (${activeDino.stage}→${nextStage})`, action: () => evolve(activeDino.id, nextStage) }]
          : []),
        { label: `🥚 알 뽑기 (💰${coins})`, action: handleGacha },
        { label: '📋 TODO 열기', action: toggleTodo },
        { label: '📊 상태 보기', action: () => setShowStats((s) => !s) },
        ...Object.entries(SIZE_LABELS)
          .filter(([key]) => key !== currentSize)
          .map(([key, label]) => ({ label, action: () => handleSizeChange(key) })),
        user
          ? { label: '🔓 로그아웃', action: () => { window.dinoAPI?.authLogout(); } }
          : { label: '🔐 Google 로그인', action: () => { window.dinoAPI?.authLogin(); } },
      ];
      showMenu(e, items);
    },
    [activeDino, feedDino, playWithDino, handleGacha, showMenu, coins, toggleTodo, currentSize, handleSizeChange, user]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: todoOpen ? 'flex-end' : 'center',
        position: 'relative',
      }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowStats(true)}
      onMouseLeave={() => { setShowStats(false); }}
    >
      <NotificationPopup
        event={currentEvent}
        onOk={handleOk}
        onSnooze={handleSnooze}
      />

      {/* Dino area */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Login indicator */}
        {user && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid rgba(0,0,0,0.3)',
            zIndex: 10,
            title: user.displayName ?? 'Google 로그인됨',
          }} />
        )}
        <DinoCanvas />
        <StatsOverlay visible={showStats} />
        <GachaResult dino={gachaResult} onClose={() => setGachaResult(null)} />
      </div>

      {/* Side tab button */}
      <SideTab isOpen={todoOpen} onClick={toggleTodo} />

      {/* TODO Panel */}
      <TodoPanel isOpen={todoOpen} onClose={toggleTodo} />

    </div>
  );
}
