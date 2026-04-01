import React from 'react';
import { useSettingsStore, type AppLanguage, type AlarmInterval } from '../stores/settingsStore';
import { useT } from '../hooks/useT';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANG_OPTIONS: { value: AppLanguage; label: string; sub: string }[] = [
  { value: 'ko', label: '한국어', sub: 'Korean' },
  { value: 'en', label: 'English', sub: '영어' },
];

const ALARM_VALUES: AlarmInterval[] = [0, 15, 30, 60, 120];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { language, alarmIntervalMin, backgroundVisible, setLanguage, setAlarmInterval, setBackgroundVisible } = useSettingsStore();
  const t = useT();
  const ts = t.settings;

  const alarmLabels: Record<AlarmInterval, string> = {
    0: ts.alarmOff, 15: ts.alarm15, 30: ts.alarm30, 60: ts.alarm60, 120: ts.alarm120,
  };

  if (!isOpen) return null;

  const sectionStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  };

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
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>⚙️ {ts.title}</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#94a3b8',
          cursor: 'pointer', fontSize: 16, padding: '0 2px',
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Language */}
        <div style={sectionStyle}>
          <div style={labelStyle}>{ts.language}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: `1.5px solid ${language === opt.value ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                  background: language === opt.value ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                  color: language === opt.value ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Alarm Interval */}
        <div style={sectionStyle}>
          <div style={labelStyle}>{ts.alarm}</div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>{ts.alarmDesc}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ALARM_VALUES.map((val) => {
              const label = alarmLabels[val];
              const active = alarmIntervalMin === val;
              return (
                <button
                  key={val}
                  onClick={() => setAlarmInterval(val)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    border: `1.5px solid ${active ? '#4ade80' : 'rgba(255,255,255,0.1)'}`,
                    background: active ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#4ade80' : '#94a3b8',
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              );
            })}

          </div>
        </div>

        {/* Background */}
        <div style={sectionStyle}>
          <div style={labelStyle}>{ts.background}</div>
          <div style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>{ts.backgroundDesc}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([false, true] as const).map((on) => {
              const label = on ? ts.bgOn : ts.bgOff;
              const active = backgroundVisible === on;
              return (
                <button
                  key={String(on)}
                  onClick={() => setBackgroundVisible(on)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 8,
                    border: `1.5px solid ${active ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}`,
                    background: active
                      ? on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.04)',
                    color: active ? (on ? '#0f172a' : '#e2e8f0') : '#64748b',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: active ? 700 : 400,
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  {on ? '⬜' : '🔲'} {label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 10,
        color: '#334155',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        DinoTama v0.1.0
      </div>
    </div>
  );
}
