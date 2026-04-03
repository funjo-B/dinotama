import { describe, it, expect } from 'vitest';
import { decayStats } from './statDecay';
import type { DinoStats } from '@shared/types';

describe('decayStats', () => {
  const baseStats: DinoStats = { hunger: 80, happiness: 80, fatigue: 20 };

  it('1시간 후 hunger가 2 감소해야 한다', () => {
    const result = decayStats(baseStats, 3600000); // 1시간
    expect(result.hunger).toBeCloseTo(78);
  });

  it('1시간 후 happiness가 1.5 감소해야 한다', () => {
    const result = decayStats(baseStats, 3600000);
    expect(result.happiness).toBeCloseTo(78.5);
  });

  it('1시간 후 fatigue가 1 증가해야 한다', () => {
    const result = decayStats(baseStats, 3600000);
    expect(result.fatigue).toBeCloseTo(21);
  });

  it('hunger는 0 아래로 내려가지 않아야 한다', () => {
    const lowStats: DinoStats = { hunger: 1, happiness: 80, fatigue: 20 };
    const result = decayStats(lowStats, 3600000);
    expect(result.hunger).toBe(0);
  });

  it('fatigue는 100 위로 올라가지 않아야 한다', () => {
    const tiredStats: DinoStats = { hunger: 80, happiness: 80, fatigue: 99.5 };
    const result = decayStats(tiredStats, 3600000);
    expect(result.fatigue).toBe(100);
  });

  it('0시간이 지나면 변화가 없어야 한다', () => {
    const result = decayStats(baseStats, 0);
    expect(result.hunger).toBe(80);
    expect(result.happiness).toBe(80);
    expect(result.fatigue).toBe(20);
  });

  it('24시간 후 hunger가 크게 감소해야 한다', () => {
    const result = decayStats(baseStats, 86400000); // 24시간
    expect(result.hunger).toBeCloseTo(32); // 80 - (2 * 24)
  });
});
