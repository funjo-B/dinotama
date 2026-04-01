import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  lastCheckedDate?: string; // YYYY-MM-DD when last checked
}

const STORAGE_KEY = 'dinotama-todos';

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: TodoItem[] = JSON.parse(raw);
    const today = getTodayStr();
    // Reset done status if checked on a previous day
    return items.map((t) => {
      if (t.done && t.lastCheckedDate && t.lastCheckedDate !== today) {
        return { ...t, done: false, lastCheckedDate: undefined };
      }
      return t;
    });
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
  const [todos, setTodosRaw] = useState<TodoItem[]>(loadTodos);
  const [input, setInput] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarItem[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Wrapper that persists to localStorage
  const setTodos = useCallback((updater: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => {
    setTodosRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTodos(next);
      return next;
    });
  }, []);

  // Fetch calendar events when panel opens
  useEffect(() => {
    if (!isOpen) return;
    if (!window.dinoAPI?.calendarToday) return;

    setCalendarLoading(true);
    window.dinoAPI.calendarToday()
      .then((events) => setCalendarEvents(events ?? []))
      .catch(() => setCalendarEvents([]))
      .finally(() => setCalendarLoading(false));
  }, [isOpen]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
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
            <span style={{ fontWeight: 700, fontSize: 13 }}>
              TODO {todos.length > 0 && `(${doneCount}/${todos.length})`}
            </span>
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

          {/* Calendar Section */}
          {calendarEvents.length > 0 && (
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{
                padding: '8px 14px 4px',
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 600,
              }}>
                오늘 일정
              </div>
              <div style={{ padding: '0 8px 8px', maxHeight: 150, overflowY: 'auto' }}>
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
                placeholder="할 일 추가..."
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
                할 일이 없습니다
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
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '0 2px',
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </div>
  );
}
