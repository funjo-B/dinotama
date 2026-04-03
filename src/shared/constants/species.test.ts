import { describe, it, expect } from 'vitest';
import { SPECIES_DEFS, HIDDEN_TRANSFORMS, getTransformedDef, SELL_PRICES, STAGE_SELL_MULTIPLIER } from './species';

describe('히든 변신 시스템', () => {
  it('히든 종 3종에 변신 정보가 있어야 한다', () => {
    expect(HIDDEN_TRANSFORMS.chicken).toBeDefined();
    expect(HIDDEN_TRANSFORMS.carp).toBeDefined();
    expect(HIDDEN_TRANSFORMS.lizard).toBeDefined();
  });

  it('닭 → 불사조 변신', () => {
    expect(HIDDEN_TRANSFORMS.chicken!.nameKo).toBe('불사조');
    expect(HIDDEN_TRANSFORMS.chicken!.nameEn).toBe('Phoenix');
    expect(HIDDEN_TRANSFORMS.chicken!.spriteFolder).toBe('phoenix');
  });

  it('잉어 → 동양용 변신', () => {
    expect(HIDDEN_TRANSFORMS.carp!.nameKo).toBe('동양용');
    expect(HIDDEN_TRANSFORMS.carp!.spriteFolder).toBe('eastern_dragon');
  });

  it('도마뱀 → 서양용 변신', () => {
    expect(HIDDEN_TRANSFORMS.lizard!.nameKo).toBe('서양용');
    expect(HIDDEN_TRANSFORMS.lizard!.spriteFolder).toBe('western_dragon');
  });
});

describe('getTransformedDef', () => {
  it('baby 닭은 원래 이름을 반환해야 한다', () => {
    const def = getTransformedDef('chicken', 'baby');
    expect(def.nameKo).toBe('닭');
  });

  it('teen 닭은 원래 이름을 반환해야 한다', () => {
    const def = getTransformedDef('chicken', 'teen');
    expect(def.nameKo).toBe('닭');
  });

  it('adult 닭은 불사조로 변신해야 한다', () => {
    const def = getTransformedDef('chicken', 'adult');
    expect(def.nameKo).toBe('불사조');
    expect(def.nameEn).toBe('Phoenix');
    expect(def.baseColor).toBe('#ff4500');
  });

  it('adult 잉어는 동양용으로 변신해야 한다', () => {
    const def = getTransformedDef('carp', 'adult');
    expect(def.nameKo).toBe('동양용');
  });

  it('일반 종은 adult여도 변신하지 않아야 한다', () => {
    const def = getTransformedDef('tyrannosaurus', 'adult');
    expect(def.nameKo).toBe('티라노사우루스');
  });
});

describe('SPECIES_DEFS 무결성', () => {
  it('모든 종에 필수 필드가 있어야 한다', () => {
    for (const [id, def] of Object.entries(SPECIES_DEFS)) {
      expect(def.id, `${id}: id 불일치`).toBe(id);
      expect(def.nameKo, `${id}: nameKo 비어있음`).toBeTruthy();
      expect(def.nameEn, `${id}: nameEn 비어있음`).toBeTruthy();
      expect(def.baseColor, `${id}: baseColor 비어있음`).toMatch(/^#/);
      expect(['common', 'rare', 'epic', 'legend', 'hidden']).toContain(def.rarity);
      expect(['herbivore', 'carnivore', 'flyer', 'aquatic', 'special']).toContain(def.diet);
    }
  });

  it('히든 종의 diet는 special이어야 한다', () => {
    expect(SPECIES_DEFS.chicken.diet).toBe('special');
    expect(SPECIES_DEFS.carp.diet).toBe('special');
    expect(SPECIES_DEFS.lizard.diet).toBe('special');
  });
});
