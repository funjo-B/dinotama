import React, { useState, useEffect } from 'react';
import { useDinoStore } from '../stores/dinoStore';

export function SyncStatusIndicator() {
  const syncStatus = useDinoStore((s) => s.syncStatus);
  const syncError = useDinoStore((s) => s.syncError);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  // 에러 시 계속 표시, 성공/동기화 중일 때 잠깐 표시 후 사라짐
  useEffect(() => {
    if (syncStatus === 'error') {
      setVisible(true);
    } else if (syncStatus === 'syncing' || syncStatus === 'success') {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), syncStatus === 'success' ? 2000 : 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [syncStatus]);

  if (!visible && !hover) return null;

  const dotColor =
    syncStatus === 'error' ? '#ef4444' :
    syncStatus === 'syncing' ? '#fbbf24' :
    syncStatus === 'success' ? '#4ade80' :
    '#64748b';

  const label =
    syncStatus === 'error' ? (syncError ?? '동기화 실패') :
    syncStatus === 'syncing' ? '저장 중...' :
    syncStatus === 'success' ? '저장 완료' :
    '';

  const handleRetry = () => {
    if (syncStatus !== 'error') return;
    useDinoStore.setState({ syncStatus: 'syncing', syncError: null });
    import('../services/firebase').then(({ syncNow, getCurrentUser }) => {
      const user = getCurrentUser();
      if (!user) {
        useDinoStore.setState({ syncStatus: 'idle', syncError: null });
        return;
      }
      const snap = useDinoStore.getState().getSnapshot();
      syncNow({
        uid: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        ...snap,
        lastSyncTime: Date.now(),
      }).then(() => {
        useDinoStore.setState({ syncStatus: 'success', syncError: null });
      }).catch((err) => {
        useDinoStore.setState({ syncStatus: 'error', syncError: err instanceof Error ? err.message : '동기화 실패' });
      });
    });
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={syncStatus === 'error' ? handleRetry : undefined}
      style={{
        position: 'absolute',
        bottom: 38,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 200,
        cursor: syncStatus === 'error' ? 'pointer' : 'default',
        padding: '2px 6px',
        borderRadius: 6,
        background: hover ? 'rgba(0,0,0,0.7)' : 'transparent',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: dotColor,
        boxShadow: `0 0 4px ${dotColor}`,
        animation: syncStatus === 'syncing' ? 'pulse 1s infinite' : 'none',
      }} />
      {(hover || syncStatus === 'error') && (
        <span style={{
          fontSize: 8,
          color: dotColor,
          whiteSpace: 'nowrap',
        }}>
          {label}{syncStatus === 'error' ? ' (클릭하여 재시도)' : ''}
        </span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
