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
import { GachaMultiAnimation } from './components/GachaMultiAnimation';
import { GachaPanel } from './components/GachaPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useT, useSpeciesName } from './hooks/useT';

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
      onPull={(count) => handleAction('pullGacha', count)}
    />;
  }
  if (panelType === 'settings') {
    return <SettingsPanel isOpen={true} onClose={() => window.dinoAPI?.closePanel?.()} />;
  }
  return null;
}

// ─── Main Dino Window App ───
function DinoApp() {
  const [gachaResult, setGachaResult] = useState<Dino | null>(null);
  const [gachaAnimating, setGachaAnimating] = useState(false);
  const [gachaMultiResults, setGachaMultiResults] = useState<Dino[]>([]);
  const [multiPullKey, setMultiPullKey] = useState(0);
  const [renameMode, setRenameMode] = useState(false);
  const [todoReminder, setTodoReminder] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { alarmIntervalMin, backgroundVisible, setBackgroundVisible } = useSettingsStore();
  const t = useT();
  const getSpeciesName = useSpeciesName();
  const { onMouseDown } = useDrag();
  const { showMenu } = useContextMenu();
  const { activeDino, dinos, pullGacha, pullGachaMulti, coins, setActiveDino, renameDino, sellDino } = useDinoStore();
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
          const count: number = args[0] ?? 1;
          if (count === 1) {
            const result = store.pullGacha(false);
            if (result) { setGachaResult(result); setGachaAnimating(true); }
          } else {
            const results = store.pullGachaMulti(count, false);
            if (results.length > 0) { setGachaMultiResults(results); setMultiPullKey((k) => k + 1); }
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

  // Auto reminder — interval from settings (0 = off)
  useEffect(() => {
    if (alarmIntervalMin === 0) return;
    const ms = alarmIntervalMin * 60 * 1000;
    function scheduleNext() {
      // ±20% jitter so it doesn't feel robotic
      const jitter = randomInterval(ms * 0.8, ms * 1.2);
      return setTimeout(() => {
        triggerTodoReminder();
        timerRef.current = scheduleNext();
      }, jitter);
    }
    const timerRef = { current: scheduleNext() };
    return () => clearTimeout(timerRef.current);
  }, [triggerTodoReminder, alarmIntervalMin]);

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

  const handleGacha = useCallback((count: number = 1) => {
    if (gachaAnimating || gachaMultiResults.length > 0) return;
    if (count === 1) {
      const result = pullGacha(false);
      if (result) { setGachaResult(result); setGachaAnimating(true); }
    } else {
      const results = pullGachaMulti(count, false);
      if (results.length > 0) { setGachaMultiResults(results); setMultiPullKey((k) => k + 1); }
    }
  }, [pullGacha, pullGachaMulti, gachaAnimating, gachaMultiResults]);

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
          ? [{ label: t.menu.rename(activeDino.name), action: () => { setRenameMode(true); setTimeout(() => renameInputRef.current?.focus(), 100); } }]
          : []),
        { type: 'separator' as const, label: '' },
        { label: t.menu.gacha(coins), action: () => window.dinoAPI?.openPanel?.('gacha') },
        ...(dinos.length > 1
          ? [{
              label: t.menu.selectDino,
              submenu: [
                ...dinos.slice(0, 5).map((d) => {
                  const sName = getSpeciesName(SPECIES_DEFS[d.species], d.species);
                  const stageLabel = t.menu.stage[d.stage];
                  const check = d.id === activeDino?.id ? ' ✓' : '';
                  return { label: `${d.name} (${sName}/${stageLabel})${check}`, action: () => setActiveDino(d.id) };
                }),
                ...(dinos.length > 5
                  ? [{ type: 'separator' as const, label: '' }, { label: t.menu.viewAll(dinos.length), action: () => window.dinoAPI?.openPanel?.('collection') }]
                  : []),
              ],
            }]
          : []),
        { type: 'separator' as const, label: '' },
        { label: t.menu.collection, action: () => window.dinoAPI?.openPanel?.('collection') },
        { label: t.menu.todo, action: () => window.dinoAPI?.openPanel?.('todo') },
        { label: t.menu.settings, action: () => window.dinoAPI?.openPanel?.('settings') },
        { label: t.menu.testAlarm, action: triggerTodoReminder },
        { label: t.menu.addCoins, action: () => useDinoStore.setState((s) => ({ coins: s.coins + 1000 })) },
        { type: 'separator' as const, label: '' },
        {
          label: t.menu.position,
          submenu: [
            { label: t.menu.resetPos, action: () => window.dinoAPI?.resetPosition?.() },
            { label: t.menu.savePos, action: () => window.dinoAPI?.savePosition?.() },
            { label: t.menu.restorePos, action: () => window.dinoAPI?.restorePosition?.() },
          ],
        },
        { type: 'separator' as const, label: '' },
        user
          ? { label: t.menu.logout, action: () => window.dinoAPI?.authLogout() }
          : { label: t.menu.login, action: () => window.dinoAPI?.authLogin() },
      ];
      showMenu(e, items);
    },
    [activeDino, dinos, handleGacha, showMenu, coins, user, setActiveDino, renameDino, triggerTodoReminder]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: backgroundVisible ? '#ffffff' : 'transparent',
        borderRadius: backgroundVisible ? 12 : 0,
        transition: 'background 0.3s ease',
      }}
      onMouseDown={onMouseDown}
      onContextMenu={handleContextMenu}
    >
      {/* Tab buttons — left side */}
      <div style={{
        position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100,
      }}>
        <TipButton icon="📋" tip={t.tip.todo} onClick={() => window.dinoAPI?.openPanel?.('todo')} />
        <TipButton icon="📦" tip={t.tip.collection} onClick={() => window.dinoAPI?.openPanel?.('collection')} />
        <TipButton icon="⚙️" tip={t.tip.settings} onClick={() => window.dinoAPI?.openPanel?.('settings')} />
        <TipButton
          icon="🥚"
          tip={t.tip.gacha(coins)}
          onClick={() => window.dinoAPI?.openPanel?.('gacha')}
          style={{
            background: coins >= 10 ? 'rgba(251,191,36,0.2)' : 'rgba(15,15,25,0.85)',
            borderColor: coins >= 10 ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.15)',
          }}
        />
      </div>

      {/* Background toggle — right side */}
      <div style={{
        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
        zIndex: 100,
      }}>
        <TipButton
          icon={backgroundVisible ? '⬜' : '🔲'}
          tip={backgroundVisible ? (t.settings.bgOn) : (t.settings.bgOff)}
          onClick={() => setBackgroundVisible(!backgroundVisible)}
          style={{
            background: backgroundVisible ? 'rgba(255,255,255,0.3)' : 'rgba(15,15,25,0.85)',
            borderColor: backgroundVisible ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
          }}
        />
      </div>

      <NotificationPopup event={currentEvent} onOk={handleOk} onSnooze={handleSnooze} />
      <TodoReminder message={todoReminder} onOk={handleTodoOk} onSnooze={handleTodoSnooze} />
      <GachaAnimation dino={gachaAnimating ? gachaResult : null} onComplete={handleGachaComplete} />
      {gachaMultiResults.length > 0 && (
        <GachaMultiAnimation key={multiPullKey} dinos={gachaMultiResults} onComplete={() => setGachaMultiResults([])} />
      )}

      {/* Login indicator — top right corner */}
      {user && (
        <div
          title={user.displayName ?? 'Google 로그인됨'}
          style={{
            position: 'absolute', top: 8, right: 8,
            display: 'flex', alignItems: 'center', gap: 4,
            zIndex: 200, pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 9, color: '#4ade80', opacity: 0.8 }}>
            {user.displayName?.split(' ')[0] ?? ''}
          </span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#4ade80',
            boxShadow: '0 0 6px #4ade80',
          }} />
        </div>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
