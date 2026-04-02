import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TodoItem } from '@shared/types';
import { saveTodosToCloud, loadTodosFromCloud } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useT } from '../hooks/useT';

const STORAGE_KEY = 'dinotama-todos';
const NOTIFY_GLOBAL_KEY = 'dinotama-todo-notify';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetDoneForNewDay(items: TodoItem[]): TodoItem[] {
  const today = getTodayStr();
  return items.map((t) => {
    const notify = t.notify ?? true;
    if (t.done && t.lastCheckedDate && t.lastCheckedDate !== today) {
      return { ...t, done: false, lastCheckedDate: undefined, notify };
    }
    return { ...t, notify };
  });
}

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: TodoItem[] = JSON.parse(raw);
    const reset = resetDoneForNewDay(items);
    // Save back if any items were reset
    if (JSON.stringify(reset) !== JSON.stringify(items)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    }
    return reset;
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

interface CalendarItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
}

interface TodoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isNow(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now < new Date(end).getTime();
}

function isPast(end: string): boolean {
  return Date.now() >= new Date(end).getTime();
}

export function TodoPanel({ isOpen, onClose }: TodoPanelProps) {
  const { user } = useAuth();
  const t = useT();
  const tt = t.todo;
  const [todos, setTodosRaw] = useState<TodoItem[]>(loadTodos);
  const [input, setInput] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarItem[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [globalNotify, setGlobalNotifyRaw] = useState<boolean>(() => {
    try { return localStorage.getItem(NOTIFY_GLOBAL_KEY) !== 'false'; } catch { return true; }
  });
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setGlobalNotify = useCallback((on: boolean) => {
    setGlobalNotifyRaw(on);
    localStorage.setItem(NOTIFY_GLOBAL_KEY, String(on));
  }, []);

  // Cloud save: debounced 1.5s after last change
  const scheduleCloudSave = useCallback((items: TodoItem[]) => {
    if (!user) return;
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(async () => {
      try {
        setCloudSyncing(true);
        await saveTodosToCloud(user.uid, items);
      } catch (err) {
        console.error('[Todo] Cloud save failed:', err);
      } finally {
        setCloudSyncing(false);
      }
    }, 1500);
  }, [user]);

  // Wrapper: localStorage 즉시 저장 + Firebase 디바운스 저장
  const setTodos = useCallback((updater: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => {
    setTodosRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTodos(next);
      scheduleCloudSave(next);
      return next;
    });
  }, [scheduleCloudSave]);

  const toggleItemNotify = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, notify: !t.notify } : t));
  }, [setTodos]);

  // 로그인 시 Firebase에서 로드 (1회만) → 로컬보다 최신이면 덮어쓰기
  const cloudLoadedRef = useRef(false);
  useEffect(() => {
    if (!user) { cloudLoadedRef.current = false; return; }
    if (cloudLoadedRef.current) return; // Already loaded for this user
    cloudLoadedRef.current = true;
    (async () => {
      try {
        const cloudItems = await loadTodosFromCloud(user.uid);
        if (!cloudItems) return; // 첫 사용자, 로컬 유지
        const local = loadTodos();
        // 클라우드 항목 중 로컬에 없는 것 병합 (id 기준)
        const localIds = new Set(local.map((t) => t.id));
        const merged = resetDoneForNewDay([
          ...local,
          ...cloudItems.filter((t) => !localIds.has(t.id)),
        ].sort((a, b) => a.createdAt - b.createdAt));
        setTodosRaw(merged);
        saveTodos(merged);
        console.log('[Todo] Loaded from cloud:', cloudItems.length, 'items, merged:', merged.length);
      } catch (err) {
        console.error('[Todo] Cloud load failed:', err);
      }
    })();
  }, [user]);

  // Reload todos when window gets focus (sync with main window changes)
  useEffect(() => {
    const handleFocus = () => setTodosRaw(loadTodos());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto-reset at midnight: check every minute if day changed
  useEffect(() => {
    let lastDay = getTodayStr();
    const interval = setInterval(() => {
      const now = getTodayStr();
      if (now !== lastDay) {
        lastDay = now;
        console.log('[Todo] Day changed, resetting done status');
        setTodos((prev) => resetDoneForNewDay(prev));
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [setTodos]);

  // Fetch calendar events when panel opens or day changes
  useEffect(() => {
    if (!isOpen) return;
    if (!window.dinoAPI?.calendarDay) return;

    setCalendarLoading(true);
    window.dinoAPI.calendarDay(dayOffset)
      .then((events) => setCalendarEvents(events ?? []))
      .catch(() => setCalendarEvents([]))
      .finally(() => setCalendarLoading(false));
  }, [isOpen, dayOffset]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now(), notify: true },
    ]);
    setInput('');
  }, [input, setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newDone = !t.done;
        return { ...t, done: newDone, lastCheckedDate: newDone ? getTodayStr() : undefined };
      })
    );
  }, [setTodos]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, [setTodos]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') addTodo();
    },
    [addTodo]
  );

  const doneCount = todos.filter((t) => t.done).length;

  if (!isOpen) return null;

  return (
        <div
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
            <span style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              {tt.title} {todos.length > 0 && `(${doneCount}/${todos.length})`}
              {user && (
                <span style={{ fontSize: 8, color: cloudSyncing ? '#fbbf24' : '#4ade80', fontWeight: 400 }}>
                  {cloudSyncing ? tt.syncing : tt.syncDone}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setGlobalNotify(!globalNotify)}
                  onMouseEnter={(e) => { const tip = e.currentTarget.nextElementSibling as HTMLElement; if (tip) tip.style.opacity = '1'; }}
                  onMouseLeave={(e) => { const tip = e.currentTarget.nextElementSibling as HTMLElement; if (tip) tip.style.opacity = '0'; }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '0 2px',
                    opacity: globalNotify ? 1 : 0.4,
                  }}
                >
                  {globalNotify ? '🔔' : '🔕'}
                </button>
                <span style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 4,
                  background: 'rgba(0,0,0,0.85)',
                  color: globalNotify ? '#4ade80' : '#94a3b8',
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                  pointerEvents: 'none',
                }}>
                  {globalNotify ? tt.notifyOn : tt.notifyOff}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '0 2px',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Calendar Section */}
          {(calendarEvents.length > 0 || calendarLoading || window.dinoAPI?.calendarDay) && (
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Date nav header */}
              <div style={{
                padding: '6px 10px 2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <button
                  onClick={() => setDayOffset((d) => d - 1)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1 }}
                >‹</button>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + dayOffset);
                    const month = d.getMonth() + 1;
                    const date = d.getDate();
                    const days = tt.days;
                    const day = days[d.getDay()];
                    const label = dayOffset === 0 ? tt.dateLabel.today
                      : dayOffset === 1 ? tt.dateLabel.tomorrow
                      : dayOffset === -1 ? tt.dateLabel.yesterday
                      : dayOffset > 0 ? tt.dateLabel.daysAfter(dayOffset)
                      : tt.dateLabel.daysBefore(dayOffset);
                    return (
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
                        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700 }}>{tt.formatDate(month, date)} ({day})</span>
                      </span>
                    );
                  })()}
                  {dayOffset !== 0 && (
                    <button
                      onClick={() => setDayOffset(0)}
                      style={{ display: 'block', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 9, marginTop: 2, padding: 0, width: '100%', textAlign: 'center' }}
                    >{tt.backToToday}</button>
                  )}
                </span>
                <button
                  onClick={() => setDayOffset((d) => d + 1)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1 }}
                >›</button>
              </div>
              <div style={{ padding: '0 8px 8px', maxHeight: 150, overflowY: 'auto' }}>
                {!calendarLoading && calendarEvents.length === 0 && (
                  <div style={{ padding: '6px 6px', fontSize: 10, color: '#475569', textAlign: 'center' }}>
                    {tt.noSchedule}
                  </div>
                )}
                {calendarEvents.map((evt) => {
                  const past = isPast(evt.endTime);
                  const now = isNow(evt.startTime, evt.endTime);
                  return (
                    <div
                      key={evt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '5px 6px',
                        borderRadius: 6,
                        background: now ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                        opacity: past ? 0.4 : 1,
                      }}
                    >
                      <span style={{
                        color: now ? '#4ade80' : '#64748b',
                        fontSize: 10,
                        flexShrink: 0,
                        marginTop: 1,
                        fontWeight: now ? 700 : 400,
                      }}>
                        {formatTime(evt.startTime)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 11,
                          color: past ? '#64748b' : '#e2e8f0',
                          textDecoration: past ? 'line-through' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                            {evt.location}
                          </div>
                        )}
                      </div>
                      {now && <span style={{ fontSize: 8, color: '#4ade80', flexShrink: 0, marginTop: 2 }}>NOW</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {calendarLoading && (
            <div style={{ padding: '8px 14px', fontSize: 11, color: '#64748b' }}>
              일정 불러오는 중...
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tt.addPlaceholder}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: 11,
                  outline: 'none',
                }}
              />
              <button
                onClick={addTodo}
                style={{
                  background: '#4ade80',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 10px',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {todos.length === 0 && calendarEvents.length === 0 && !calendarLoading && (
              <div style={{
                padding: 20,
                textAlign: 'center',
                color: '#64748b',
                fontSize: 11,
              }}>
                {tt.empty}
              </div>
            )}
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${todo.done ? '#4ade80' : '#475569'}`,
                    background: todo.done ? '#4ade80' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 10,
                    color: '#000',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {todo.done && '✓'}
                </div>
                <span
                  onClick={() => toggleTodo(todo.id)}
                  style={{
                    flex: 1,
                    textDecoration: todo.done ? 'line-through' : 'none',
                    color: todo.done ? '#64748b' : '#e2e8f0',
                    transition: 'color 0.15s',
                    wordBreak: 'break-word',
                  }}
                >
                  {todo.text}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleItemNotify(todo.id); }}
                  title={todo.notify ? '알림 ON' : '알림 OFF'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '2px 4px',
                    opacity: todo.notify ? 0.8 : 0.3,
                    flexShrink: 0,
                  }}
                >
                  {todo.notify ? '🔔' : '🔕'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 13,
                    padding: '2px 6px',
                    opacity: 0.6,
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'none'; }}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </div>
  );
}
