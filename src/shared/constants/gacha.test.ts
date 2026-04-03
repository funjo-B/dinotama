import { describe, it, expect } from 'vitest';
import { GACHA_RATES, PITY_THRESHOLDS, STAGE_THRESHOLDS, RARITY_ACTION_COUNT } from './gacha';
import { SPECIES_POOL, SPECIES_DEFS, SELL_PRICES, STAGE_SELL_MULTIPLIER } from './species';

describe('가챠 확률', () => {
  it('전체 확률 합이 1.0이어야 한다', () => {
    const total = Object.values(GACHA_RATES).reduce((sum, r) => sum + r, 0);
    expect(total).toBeCloseTo(1.0);
  });

  it('레어도별 확률이 올바른 값이어야 한다', () => {
    expect(GACHA_RATES.common).toBe(0.50);
    expect(GACHA_RATES.rare).toBe(0.30);
    expect(GACHA_RATES.epic).toBe(0.15);
    expect(GACHA_RATES.legend).toBe(0.04);
    expect(GACHA_RATES.hidden).toBe(0.01);
  });
});

describe('천장 시스템', () => {
  it('천장 값이 올바르게 설정되어야 한다', () => {
    expect(PITY_THRESHOLDS.epic).toBe(50);
    expect(PITY_THRESHOLDS.legend).toBe(100);
    expect(PITY_THRESHOLDS.hidden).toBe(300);
  });

  it('epic < legend < hidden 순서여야 한다', () => {
    expect(PITY_THRESHOLDS.epic).toBeLessThan(PITY_THRESHOLDS.legend);
    expect(PITY_THRESHOLDS.legend).toBeLessThan(PITY_THRESHOLDS.hidden);
  });
});

describe('종(species) 풀', () => {
  it('전체 41종이어야 한다', () => {
    const totalSpecies = Object.values(SPECIES_POOL).flat().length;
    expect(totalSpecies).toBe(41);
  });

  it('레어도별 종 수가 맞아야 한다', () => {
    expect(SPECIES_POOL.common).toHaveLength(11);
    expect(SPECIES_POOL.rare).toHaveLength(11);
    expect(SPECIES_POOL.epic).toHaveLength(10);
    expect(SPECIES_POOL.legend).toHaveLength(6);
    expect(SPECIES_POOL.hidden).toHaveLength(3);
  });

  it('모든 종에 SPECIES_DEFS 정의가 있어야 한다', () => {
    const allSpecies = Object.values(SPECIES_POOL).flat();
    for (const species of allSpecies) {
      expect(SPECIES_DEFS[species], `${species}에 대한 정의가 없음`).toBeDefined();
      expect(SPECIES_DEFS[species].rarity).toBeDefined();
      expect(SPECIES_DEFS[species].nameKo).toBeTruthy();
      expect(SPECIES_DEFS[species].nameEn).toBeTruthy();
    }
  });

  it('SPECIES_DEFS의 rarity가 풀과 일치해야 한다', () => {
    for (const [rarity, pool] of Object.entries(SPECIES_POOL)) {
      for (const species of pool) {
        expect(SPECIES_DEFS[species].rarity).toBe(rarity);
      }
    }
  });

  it('종 ID에 중복이 없어야 한다', () => {
    const allSpecies = Object.values(SPECIES_POOL).flat();
    const unique = new Set(allSpecies);
    expect(unique.size).toBe(allSpecies.length);
  });
});

describe('판매 가격', () => {
  it('레어도별 판매가가 올바르게 설정되어야 한다', () => {
    expect(SELL_PRICES.common).toBe(3);
    expect(SELL_PRICES.rare).toBe(5);
    expect(SELL_PRICES.epic).toBe(10);
    expect(SELL_PRICES.legend).toBe(50);
    expect(SELL_PRICES.hidden).toBe(100);
  });

  it('레어도가 높을수록 비싸야 한다', () => {
    expect(SELL_PRICES.common).toBeLessThan(SELL_PRICES.rare);
    expect(SELL_PRICES.rare).toBeLessThan(SELL_PRICES.epic);
    expect(SELL_PRICES.epic).toBeLessThan(SELL_PRICES.legend);
    expect(SELL_PRICES.legend).toBeLessThan(SELL_PRICES.hidden);
  });

  it('스테이지 배율이 올바르게 설정되어야 한다', () => {
    expect(STAGE_SELL_MULTIPLIER.baby).toBe(1);
    expect(STAGE_SELL_MULTIPLIER.teen).toBe(2);
    expect(STAGE_SELL_MULTIPLIER.adult).toBe(4);
  });

  it('성체 히든 종 판매가가 400이어야 한다', () => {
    const price = SELL_PRICES.hidden * STAGE_SELL_MULTIPLIER.adult;
    expect(price).toBe(400);
  });
});

describe('성장 단계', () => {
  it('성장 임계값이 증가해야 한다', () => {
    expect(STAGE_THRESHOLDS.baby).toBeLessThan(STAGE_THRESHOLDS.teen);
    expect(STAGE_THRESHOLDS.teen).toBeLessThan(STAGE_THRESHOLDS.adult);
  });
});

describe('액션 개수', () => {
  it('레어도별 액션 수가 1~5로 증가해야 한다', () => {
    expect(RARITY_ACTION_COUNT.common).toBe(1);
    expect(RARITY_ACTION_COUNT.rare).toBe(2);
    expect(RARITY_ACTION_COUNT.epic).toBe(3);
    expect(RARITY_ACTION_COUNT.legend).toBe(4);
    expect(RARITY_ACTION_COUNT.hidden).toBe(5);
  });
});
