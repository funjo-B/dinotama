import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

interface TodoPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TodoPanel({ isOpen, onClose }: TodoPanelProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
    ]);
    setInput('');
  }, [input]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') addTodo();
    },
    [addTodo]
  );

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 240, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 240, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 240,
            height: '100%',
            background: 'rgba(15, 15, 25, 0.95)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            color: '#e2e8f0',
            fontSize: 12,
            backdropFilter: 'blur(16px)',
            zIndex: 10000,
            WebkitAppRegion: 'no-drag',
          }}
          onMouseDown={(e) => e.stopPropagation()}
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
            {todos.length === 0 && (
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
