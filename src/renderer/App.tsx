import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DinoCanvas } from './components/DinoCanvas';
import { NotificationPopup } from './components/NotificationPopup';
import { TodoPanel } from './components/TodoPanel';
import { CollectionPanel } from './components/CollectionPanel';
import { useDrag } from './hooks/useDrag';
import { useContextMenu } from './hooks/useContextMenu';
import { useCalendarNotifications } from './hooks/useCalendarNotifications';
import { useAuth } from './hooks/useAuth';
import { useDinoStore } from './stores/dinoStore';
import type { Dino } from '@shared/types';
import { SPECIES_DEFS } from '@shared/constants';
import type { MenuItem } from './hooks/useContextMenu';
import { TodoReminder } from './components/TodoReminder';
import { GachaAnimation } from './components/GachaAnimation';
import { GachaPanel } from './components/GachaPanel';

const TODO_STORAGE_KEY = 'dinotama-todos';
const NOTIFY_GLOBAL_KEY = 'dinotama-todo-notify';

function isGlobalNotifyOn(): boolean {
  try { return localStorage.getItem(NOTIFY_GLOBAL_KEY) !== 'false'; } catch { return true; }
}

function getNotifiableUndoneTodos(): string[] {
  try {
    if (!isGlobalNotifyOn()) return [];
    const raw = localStorage.getItem(TODO_STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return items
      .filter((t: any) => {
        const undone = !t.done || (t.lastCheckedDate && t.lastCheckedDate !== today);
        const notifyOn = t.notify !== false; // default true
        return undone && notifyOn;
      })
      .map((t: any) => t.text);
  } catch { return []; }
}

// Random interval between min and max ms
function randomInterval(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs);
}

// Detect if this is a panel window
const hash = window.location.hash;
const isPanelWindow = hash.startsWith('#panel-');
const panelType = isPanelWindow ? hash.replace('#panel-', '') : null;

// ─── Panel Window App ───
function PanelApp() {
  const [storeData, setStoreData] = useState<any>(null);

  // Load initial data from main window
  useEffect(() => {
    window.dinoAPI?.getStoreSnapshot?.().then((data: any) => {
      if (data) {
        setStoreData(data);
        useDinoStore.getState().loadFromCloud(data);
      }
    });
  }, []);

  // Listen for store updates from main window
  useEffect(() => {
    // Poll for changes every 2 seconds (simple sync)
    const interval = setInterval(async () => {
      const data = await window.dinoAPI?.getStoreSnapshot?.();
      if (data) {
        useDinoStore.getState().loadFromCloud(data);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback((action: string, ...args: any[]) => {
    // Send action to main window and refresh
    window.dinoAPI?.sendPanelAction?.(action, ...args);
    setTimeout(async () => {
      const data = await window.dinoAPI?.getStoreSnapshot?.();
      if (data) useDinoStore.getState().loadFromCloud(data);
    }, 300);
  }, []);

  if (!storeData) {
    return <div style={{ background: 'rgb(15,15,25)', color: '#64748b', padding: 20, fontSize: 12 }}>불러오는 중...</div>;
  }

  if (panelType === 'todo') {
    return <TodoPanel isOpen={true} onClose={() => window.dinoAPI?.closePanel?.()} />;
  }
  if (panelType === 'collection') {
    return <CollectionPanel isOpen={true} onClose={() => window.dinoAPI?.closePanel?.()} onAction={handleAction} />;
  }
  if (panelType === 'gacha') {
    return <GachaPanel
      isOpen={true}
      onClose={() => window.dinoAPI?.closePanel?.()}
      onPull={() => handleAction('pullGacha')}
    />;
  }
  return null;
}

// ─── Main Dino Window App ───
function DinoApp() {
  const [gachaResult, setGachaResult] = useState<Dino | null>(null);
  const [gachaAnimating, setGachaAnimating] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [todoReminder, setTodoReminder] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { onMouseDown } = useDrag();
  const { showMenu } = useContextMenu();
  const { activeDino, dinos, pullGacha, coins, setActiveDino, renameDino, sellDino } = useDinoStore();
  const { currentEvent, handleOk, handleSnooze } = useCalendarNotifications();

  // Expose store snapshot for panel windows
  useEffect(() => {
    (window as any).__dinoStoreSnapshot = () => useDinoStore.getState().getSnapshot();
    return () => { delete (window as any).__dinoStoreSnapshot; };
  }, []);

  // Listen for actions from panel windows
  useEffect(() => {
    const unsub = window.dinoAPI?.onPanelAction?.((action: string, ...args: any[]) => {
      const store = useDinoStore.getState();
      switch (action) {
        case 'setActiveDino': store.setActiveDino(args[0]); break;
        case 'sellDino': store.sellDino(args[0]); break;
        case 'renameDino': store.renameDino(args[0], args[1]); break;
        case 'mergeDinos': store.mergeDinos(args[0], args[1]); break;
        case 'pullGacha': {
          const result = store.pullGacha(false);
          if (result) {
            setGachaResult(result);
            setGachaAnimating(true);
          }
          break;
        }
      }
    });
    return () => { unsub?.(); };
  }, []);

  const triggerTodoReminder = useCallback(() => {
    const todos = getNotifiableUndoneTodos();
    if (todos.length === 0) return; // nothing to remind
    const random = todos[Math.floor(Math.random() * todos.length)];
    setTodoReminder(random);
  }, []);

  // Auto reminder: random interval 20~40 min
  useEffect(() => {
    function scheduleNext() {
      const delay = randomInterval(20 * 60 * 1000, 40 * 60 * 1000);
      return setTimeout(() => {
        triggerTodoReminder();
        timerRef.current = scheduleNext();
      }, delay);
    }
    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, [triggerTodoReminder]);

  const handleTodoOk = useCallback(() => {
    // Mark this todo as done in localStorage
    try {
      const raw = localStorage.getItem(TODO_STORAGE_KEY);
      if (raw && todoReminder) {
        const items = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        const updated = items.map((t: any) =>
          t.text === todoReminder ? { ...t, done: true, lastCheckedDate: today } : t
        );
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
    setTodoReminder(null);
  }, [todoReminder]);

  const handleTodoSnooze = useCallback(() => {
    setTodoReminder(null);
  }, []);

  const handleGacha = useCallback(() => {
    if (gachaAnimating) return;
    const result = pullGacha(false);
    if (result) {
      setGachaResult(result);
      setGachaAnimating(true);
    }
  }, [pullGacha, gachaAnimating]);

  const handleGachaComplete = useCallback(() => {
    setGachaAnimating(false);
    setGachaResult(null);
  }, []);

  const handleRename = useCallback((newName: string) => {
    if (activeDino && newName.trim()) renameDino(activeDino.id, newName);
    setRenameMode(false);
  }, [activeDino, renameDino]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const items: MenuItem[] = [
        ...(activeDino
          ? [{ label: `✏️ 이름 변경 (${activeDino.name})`, action: () => { setRenameMode(true); setTimeout(() => renameInputRef.current?.focus(), 100); } }]
          : []),
        { type: 'separator' as const, label: '' },
        { label: `🥚 알 뽑기 (💰${coins})`, action: () => window.dinoAPI?.openPanel?.('gacha') },
        ...(dinos.length > 1
          ? [{
              label: '🦕 공룡 선택',
              submenu: [
                ...dinos.slice(0, 5).map((d) => {
                  const sName = SPECIES_DEFS[d.species]?.nameKo ?? d.species;
                  const stageLabel = { egg: '🥚알', baby: '🐣아기', teen: '🦕청소년', adult: '🦖성체' }[d.stage];
                  const check = d.id === activeDino?.id ? ' ✓' : '';
                  return { label: `${d.name} (${sName}/${stageLabel})${check}`, action: () => setActiveDino(d.id) };
                }),
                ...(dinos.length > 5
                  ? [{ type: 'separator' as const, label: '' }, { label: `📦 전체 보기 (${dinos.length}마리)`, action: () => window.dinoAPI?.openPanel?.('collection') }]
                  : []),
              ],
            }]
          : []),
        { type: 'separator' as const, label: '' },
        { label: '📦 컬렉션', action: () => window.dinoAPI?.openPanel?.('collection') },
        { label: '📋 TODO', action: () => window.dinoAPI?.openPanel?.('todo') },
        { label: '🔔 TODO 알림 테스트', action: triggerTodoReminder },
        { label: '💰 코인 1000 충전 (테스트)', action: () => useDinoStore.setState((s) => ({ coins: s.coins + 1000 })) },
        { type: 'separator' as const, label: '' },
        {
          label: '📍 위치',
          submenu: [
            { label: '🔄 위치 초기화', action: () => window.dinoAPI?.resetPosition?.() },
            { label: '💾 현재 위치 기억', action: () => window.dinoAPI?.savePosition?.() },
            { label: '📍 기억한 위치로 이동', action: () => window.dinoAPI?.restorePosition?.() },
          ],
        },
        { type: 'separator' as const, label: '' },
        user
          ? { label: '🔓 로그아웃', action: () => window.dinoAPI?.authLogout() }
          : { label: '🔐 Google 로그인', action: () => window.dinoAPI?.authLogin() },
      ];
      showMenu(e, items);
    },
    [activeDino, dinos, handleGacha, showMenu, coins, user, setActiveDino, renameDino, triggerTodoReminder]
  );

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* Tab buttons — left side */}
      <div style={{
        position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100,
      }}>
        <TipButton icon="📋" tip="TODO" onClick={() => window.dinoAPI?.openPanel?.('todo')} />
        <TipButton icon="📦" tip="컬렉션" onClick={() => window.dinoAPI?.openPanel?.('collection')} />
        <TipButton
          icon="🥚"
          tip={`알 뽑기 (💰${coins})`}
          onClick={() => window.dinoAPI?.openPanel?.('gacha')}
          style={{
            background: coins >= 10 ? 'rgba(251,191,36,0.2)' : 'rgba(15,15,25,0.85)',
            borderColor: coins >= 10 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.15)',
          }}
        />
      </div>

      <NotificationPopup event={currentEvent} onOk={handleOk} onSnooze={handleSnooze} />
      <TodoReminder message={todoReminder} onOk={handleTodoOk} onSnooze={handleTodoSnooze} />
      <GachaAnimation dino={gachaAnimating ? gachaResult : null} onComplete={handleGachaComplete} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {user && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#4ade80', border: '2px solid rgba(0,0,0,0.3)', zIndex: 10,
          }} title={user.displayName ?? 'Google 로그인됨'} />
        )}
        <DinoCanvas />
        {renameMode && activeDino && (
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            <input
              ref={renameInputRef}
              defaultValue={activeDino.name}
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setRenameMode(false);
              }}
              onBlur={(e) => handleRename(e.target.value)}
              style={{
                width: 120, fontSize: 11, padding: '2px 6px', borderRadius: 4,
                border: '1px solid #4ade80', background: 'rgba(0,0,0,0.85)',
                color: '#fff', outline: 'none', textAlign: 'center',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return isPanelWindow ? <PanelApp /> : <DinoApp />;
}

const tabBtnBase: React.CSSProperties = {
  background: 'rgba(15,15,25,0.85)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  padding: '6px 7px',
  cursor: 'pointer',
  fontSize: 13,
  color: '#fff',
  backdropFilter: 'blur(8px)',
  position: 'relative',
};

function TipButton({ icon, tip, onClick, style }: { icon: string; tip: string; onClick: () => void; style?: React.CSSProperties }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ ...tabBtnBase, ...style }}
      >
        {icon}
      </button>
      {hover && (
        <div style={{
          position: 'absolute',
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: 6,
          background: 'rgba(0,0,0,0.9)',
          color: '#e2e8f0',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {tip}
        </div>
      )}
    </div>
  );
}
