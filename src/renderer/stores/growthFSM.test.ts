import { describe, it, expect } from 'vitest';
import { getNextStage, calculateGrowthPoints, checkEvolution, getStageName, getEvolutionInfo } from './growthFSM';
import type { Dino, DinoStats } from '@shared/types';

function makeDino(overrides: Partial<Dino> = {}): Dino {
  return {
    id: 'test-id',
    name: 'TestDino',
    species: 'gallimimus',
    rarity: 'common',
    stage: 'baby',
    birthTime: Date.now(),
    stageProgress: 0,
    ...overrides,
  };
}

const fullStats: DinoStats = { hunger: 100, happiness: 100, fatigue: 0 };
const lowStats: DinoStats = { hunger: 0, happiness: 0, fatigue: 100 };

describe('getNextStage', () => {
  it('egg → baby', () => {
    expect(getNextStage('egg')).toBe('baby');
  });

  it('baby → teen', () => {
    expect(getNextStage('baby')).toBe('teen');
  });

  it('teen → adult', () => {
    expect(getNextStage('teen')).toBe('adult');
  });

  it('adult → null (최대 단계)', () => {
    expect(getNextStage('adult')).toBeNull();
  });
});

describe('calculateGrowthPoints', () => {
  it('스탯이 만점이면 성장 포인트가 1 증가해야 한다', () => {
    const dino = makeDino({ stageProgress: 10 });
    const result = calculateGrowthPoints(dino, fullStats);
    expect(result).toBeCloseTo(11);
  });

  it('스탯이 0이면 성장 포인트가 증가하지 않아야 한다', () => {
    const dino = makeDino({ stageProgress: 10 });
    const result = calculateGrowthPoints(dino, lowStats);
    expect(result).toBeCloseTo(10);
  });

  it('스탯이 중간이면 0.5만큼 증가해야 한다', () => {
    const dino = makeDino({ stageProgress: 5 });
    const midStats: DinoStats = { hunger: 50, happiness: 50, fatigue: 50 };
    const result = calculateGrowthPoints(dino, midStats);
    expect(result).toBeCloseTo(5.5);
  });
});

describe('checkEvolution', () => {
  it('stageProgress가 임계값 미만이면 진화하지 않아야 한다', () => {
    const dino = makeDino({ stage: 'baby', stageProgress: 50 });
    expect(checkEvolution(dino)).toBeNull();
  });

  it('baby → teen: stageProgress >= 300이면 진화해야 한다', () => {
    const dino = makeDino({ stage: 'baby', stageProgress: 300 });
    expect(checkEvolution(dino)).toBe('teen');
  });

  it('teen → adult: stageProgress >= 600이면 진화해야 한다', () => {
    const dino = makeDino({ stage: 'teen', stageProgress: 600 });
    expect(checkEvolution(dino)).toBe('adult');
  });

  it('adult는 더 이상 진화하지 않아야 한다', () => {
    const dino = makeDino({ stage: 'adult', stageProgress: 9999 });
    expect(checkEvolution(dino)).toBeNull();
  });
});

describe('getStageName', () => {
  it('각 단계의 한국어 이름을 반환해야 한다', () => {
    expect(getStageName('egg')).toBe('알');
    expect(getStageName('baby')).toBe('유년기');
    expect(getStageName('teen')).toBe('성장기');
    expect(getStageName('adult')).toBe('성숙기');
  });
});

describe('getEvolutionInfo', () => {
  it('baby의 다음 단계와 임계값을 반환해야 한다', () => {
    const dino = makeDino({ stage: 'baby', stageProgress: 150 });
    const info = getEvolutionInfo(dino);
    expect(info.nextStage).toBe('teen');
    expect(info.progress).toBe(150);
    expect(info.threshold).toBe(300);
  });

  it('adult는 nextStage가 null이어야 한다', () => {
    const dino = makeDino({ stage: 'adult', stageProgress: 700 });
    const info = getEvolutionInfo(dino);
    expect(info.nextStage).toBeNull();
    expect(info.threshold).toBe(0);
  });
});
