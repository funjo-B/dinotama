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
import { SPECIES_DEFS, getTransformedDef } from '@shared/constants';
import type { MenuItem } from './hooks/useContextMenu';
import { TodoReminder } from './components/TodoReminder';
import { GachaAnimation } from './components/GachaAnimation';
import { GachaMultiAnimation } from './components/GachaMultiAnimation';
import { GachaPanel } from './components/GachaPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useT, useSpeciesName } from './hooks/useT';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';

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
      onPull={(count) => {
        handleAction('pullGacha', count);
        // Refresh store immediately after pull so coins update fast
        setTimeout(async () => {
          const data = await window.dinoAPI?.getStoreSnapshot?.();
          if (data) useDinoStore.getState().loadFromCloud(data);
        }, 100);
      }}
      userUid={storeData?.uid || null}
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

  // Expose store snapshot for panel windows (include uid for ad reward)
  useEffect(() => {
    (window as any).__dinoStoreSnapshot = () => ({
      ...useDinoStore.getState().getSnapshot(),
      uid: user?.uid || null,
    });
    return () => { delete (window as any).__dinoStoreSnapshot; };
  }, [user]);

  // Process ad reward token → 30 coins
  const processRewardToken = useCallback(async (token: string) => {
    try {
      const result = await window.dinoAPI?.validateAdReward?.(token);
      if (result?.valid) {
        const store = useDinoStore.getState();
        const coins = store.grantAdReward();
        store.useAdReward();
        console.log(`[Reward] Granted ${coins} coins from ad reward`);
      } else {
        console.warn('[Reward] Validation failed:', result?.reason);
      }
    } catch (err) {
      console.error('[Reward] Error processing reward:', err);
    }
  }, []);

  // Deep link listener — handle ad reward tokens
  useEffect(() => {
    const unsub = window.dinoAPI?.onDeepLink?.((data: { action: string; params: Record<string, string> }) => {
      if (data.action === 'reward' && data.params.token) {
        processRewardToken(data.params.token);
      }
    });
    return () => { unsub?.(); };
  }, [processRewardToken]);

  // Clipboard check — fallback for when deep link doesn't work (dev mode)
  useEffect(() => {
    const REWARD_PREFIX = 'DINOTAMA_REWARD:';
    let processing = false;

    const checkClipboard = async () => {
      if (processing) return;
      try {
        const text = window.dinoAPI?.readClipboard?.();
        if (text && text.startsWith(REWARD_PREFIX)) {
          processing = true;
          const token = text.slice(REWARD_PREFIX.length);
          window.dinoAPI?.clearClipboard?.();
          await processRewardToken(token);
          processing = false;
        }
      } catch {}
    };

    window.addEventListener('focus', checkClipboard);
    // Also check periodically in case focus event is missed
    const interval = setInterval(checkClipboard, 3000);
    return () => {
      window.removeEventListener('focus', checkClipboard);
      clearInterval(interval);
    };
  }, [processRewardToken]);

  // Listen for actions from panel windows
  useEffect(() => {
    const unsub = window.dinoAPI?.onPanelAction?.((action: string, ...args: any[]) => {
      const store = useDinoStore.getState();
      switch (action) {
        case 'setActiveDino': store.setActiveDino(args[0]); break;
        case 'sellDino': store.sellDino(args[0]); break;
        case 'renameDino': store.renameDino(args[0], args[1]); break;
        case 'mergeDinos': store.mergeDinos(args[0], args[1]); break;
        case 'clearAllDinos': store.clearAllDinos(); break;
        case 'generateAllSpecies': store.generateAllSpecies(); break;
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
                  const sName = getSpeciesName(getTransformedDef(d.species, d.stage), d.species);
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

      {/* Right side — checkin + background toggle */}
      <div style={{
        position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4, zIndex: 100,
      }}>
        <CheckinButton />
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
      {user && <SyncStatusIndicator />}
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

      {/* Action buttons — pinned to bottom of window */}
      {activeDino && <ActionBar />}

      <div
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => {
          const emo = useDinoStore.getState().activeEmotion;
          if (emo === 'idle' || emo.startsWith('idle')) {
            const variants: import('@shared/types').DinoEmotion[] = ['idle1', 'idle2', 'idle3'];
            const pick = variants[Math.floor(Math.random() * variants.length)];
            useDinoStore.getState().setActiveEmotion(pick);
            setTimeout(() => useDinoStore.getState().setActiveEmotion('idle'), 2000);
          }
        }}
      >
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

// ─── 감정 액션 버튼 (등급별 차등) ───────────────────────────────────────────
import { RARITY_ACTION_COUNT } from '@shared/constants';

const ALL_ACTIONS: { icon: string; labelKey: string; emotion: import('@shared/types').DinoEmotion; duration: number }[] = [
  { icon: '🍖', labelKey: '먹이기',   emotion: 'happy',   duration: 4000 },
  { icon: '🎮', labelKey: '놀아주기', emotion: 'excited', duration: 5000 },
  { icon: '🤗', labelKey: '쓰다듬기', emotion: 'happy',   duration: 3000 },
  { icon: '😴', labelKey: '재우기',   emotion: 'sleepy',  duration: 5000 },
  { icon: '💃', labelKey: '춤추기',   emotion: 'excited', duration: 6000 },
];

const IDLE_VARIANTS: import('@shared/types').DinoEmotion[] = ['idle1', 'idle2', 'idle3'];

function ActionBar() {
  const activeDino = useDinoStore((s) => s.activeDino);
  const setActiveEmotion = useDinoStore((s) => s.setActiveEmotion);
  const activeEmotion = useDinoStore((s) => s.activeEmotion);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rarity = activeDino?.rarity ?? 'common';
  const actionCount = RARITY_ACTION_COUNT[rarity] ?? 1;
  const actions = ALL_ACTIONS.slice(0, actionCount);

  const triggerAction = useCallback((emotion: import('@shared/types').DinoEmotion, duration: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setActiveEmotion(emotion);
    timerRef.current = setTimeout(() => setActiveEmotion('idle'), duration);
  }, [setActiveEmotion]);

  // Random idle variant cycling
  const triggerRandomIdle = useCallback(() => {
    const variant = IDLE_VARIANTS[Math.floor(Math.random() * IDLE_VARIANTS.length)];
    setActiveEmotion(variant);
    // Return to idle after animation (1.5~2.5s)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActiveEmotion('idle'), 2000);
  }, [setActiveEmotion]);

  // Auto idle cycling: random interval 8~20 seconds
  useEffect(() => {
    function scheduleIdle() {
      const delay = 8000 + Math.random() * 12000;
      idleTimerRef.current = setTimeout(() => {
        const emo = useDinoStore.getState().activeEmotion;
        // Only trigger if currently in idle state
        if (emo === 'idle') {
          triggerRandomIdle();
        }
        idleTimerRef.current = scheduleIdle();
      }, delay);
      return idleTimerRef.current;
    }
    idleTimerRef.current = scheduleIdle();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [triggerRandomIdle]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 5,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        zIndex: 100,
      }}
    >
      {actions.map(({ icon, labelKey, emotion, duration }) => {
        const active = activeEmotion === emotion;
        return (
          <button
            key={labelKey}
            title={labelKey}
            onClick={() => triggerAction(emotion, duration)}
            style={{
              background: active ? 'rgba(255,255,255,0.18)' : 'rgba(15,15,25,0.75)',
              border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 8,
              padding: '4px 7px',
              fontSize: 14,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s',
              transform: active ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

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

function CheckinButton() {
  const t = useT();
  const attendance = useDinoStore((s) => s.attendance);
  const dailyCheckin = useDinoStore((s) => s.dailyCheckin);
  const [result, setResult] = useState<{ coins: number; streak: number; bonus: boolean } | null>(null);
  const [hover, setHover] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const alreadyChecked = attendance.lastCheckDate === today;

  const handleClick = () => {
    if (alreadyChecked) return;
    const res = dailyCheckin();
    if (res) {
      setResult(res);
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          ...tabBtnBase,
          background: alreadyChecked ? 'rgba(74,222,128,0.2)' : 'rgba(15,15,25,0.85)',
          borderColor: alreadyChecked ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.15)',
          fontSize: 13,
          opacity: alreadyChecked ? 0.6 : 1,
          cursor: alreadyChecked ? 'default' : 'pointer',
        }}
      >
        {alreadyChecked ? '✅' : '📅'}
      </button>
      {hover && !result && (
        <div style={{
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: 6,
          background: 'rgba(0,0,0,0.9)',
          color: alreadyChecked ? '#4ade80' : '#e2e8f0',
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {alreadyChecked
            ? `${t.checkin.done} (${t.checkin.streak(attendance.streak)})`
            : `${t.checkin.button} (+10💰)`
          }
        </div>
      )}
      {result && (
        <div style={{
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: 6,
          background: 'rgba(0,0,0,0.95)',
          color: '#4ade80',
          fontSize: 10,
          padding: '4px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(74,222,128,0.3)',
        }}>
          <div>{t.checkin.reward(result.coins)}</div>
          <div style={{ fontSize: 9, color: '#94a3b8' }}>{t.checkin.streak(result.streak)}</div>
          {result.bonus && <div style={{ color: '#fbbf24', fontSize: 9 }}>{t.checkin.bonus}</div>}
        </div>
      )}
    </div>
  );
}
