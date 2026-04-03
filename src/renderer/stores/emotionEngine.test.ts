import { describe, it, expect } from 'vitest';
import { resolveEmotion, getTriggerEmotion } from './emotionEngine';
import type { DinoStats } from '@shared/types';

describe('resolveEmotion', () => {
  it('배고프면 hungry를 반환해야 한다 (hunger < 20)', () => {
    const stats: DinoStats = { hunger: 10, happiness: 50, fatigue: 30 };
    expect(resolveEmotion(stats)).toBe('hungry');
  });

  it('피곤하면 sleepy를 반환해야 한다 (fatigue > 85)', () => {
    const stats: DinoStats = { hunger: 50, happiness: 50, fatigue: 90 };
    expect(resolveEmotion(stats)).toBe('sleepy');
  });

  it('불행하면 sad를 반환해야 한다 (happiness < 20)', () => {
    const stats: DinoStats = { hunger: 50, happiness: 10, fatigue: 30 };
    expect(resolveEmotion(stats)).toBe('sad');
  });

  it('행복하면 happy를 반환해야 한다 (happiness > 80 && hunger > 60)', () => {
    const stats: DinoStats = { hunger: 80, happiness: 85, fatigue: 50 };
    expect(resolveEmotion(stats)).toBe('happy');
  });

  it('매우 행복하고 피곤하지 않으면 excited (happiness > 90 && fatigue < 30)', () => {
    const stats: DinoStats = { hunger: 80, happiness: 95, fatigue: 10 };
    expect(resolveEmotion(stats)).toBe('excited');
  });

  it('아무 조건도 안 맞으면 idle을 반환해야 한다', () => {
    const stats: DinoStats = { hunger: 50, happiness: 50, fatigue: 50 };
    expect(resolveEmotion(stats)).toBe('idle');
  });

  it('hungry가 sleepy보다 우선순위가 높아야 한다', () => {
    const stats: DinoStats = { hunger: 5, happiness: 50, fatigue: 95 };
    expect(resolveEmotion(stats)).toBe('hungry');
  });

  it('sleepy가 sad보다 우선순위가 높아야 한다', () => {
    const stats: DinoStats = { hunger: 50, happiness: 5, fatigue: 95 };
    expect(resolveEmotion(stats)).toBe('sleepy');
  });
});

describe('getTriggerEmotion', () => {
  it('각 트리거에 대한 이모션과 지속시간을 반환해야 한다', () => {
    const fed = getTriggerEmotion('fed');
    expect(fed.emotion).toBe('happy');
    expect(fed.durationMs).toBe(3000);

    const evolved = getTriggerEmotion('evolved');
    expect(evolved.emotion).toBe('excited');
    expect(evolved.durationMs).toBe(8000);

    const gachaLegend = getTriggerEmotion('gacha_legend');
    expect(gachaLegend.emotion).toBe('excited');
    expect(gachaLegend.durationMs).toBe(10000);
  });
});
