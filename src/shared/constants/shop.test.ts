import { describe, it, expect } from 'vitest';
import { SHOP_PRODUCTS, getProductById } from './shop';

describe('상점 상품', () => {
  it('상품이 6개여야 한다', () => {
    expect(SHOP_PRODUCTS).toHaveLength(6);
  });

  it('코인 팩 3개, 프리미엄 알 팩 3개여야 한다', () => {
    const coinPacks = SHOP_PRODUCTS.filter((p) => p.coins > 0);
    const premiumPacks = SHOP_PRODUCTS.filter((p) => p.premiumEggs > 0);
    expect(coinPacks).toHaveLength(3);
    expect(premiumPacks).toHaveLength(3);
  });

  it('모든 상품에 가격이 있어야 한다', () => {
    for (const p of SHOP_PRODUCTS) {
      expect(p.priceKRW).toBeGreaterThan(0);
    }
  });

  it('코인 팩은 가격 대비 코인이 증가해야 한다 (가성비)', () => {
    const coinPacks = SHOP_PRODUCTS.filter((p) => p.coins > 0);
    const ratios = coinPacks.map((p) => p.coins / p.priceKRW);
    // 비싼 팩일수록 코인/원 비율이 높아야 함
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
    }
  });

  it('프리미엄 알 팩은 가격 대비 알이 증가해야 한다', () => {
    const eggPacks = SHOP_PRODUCTS.filter((p) => p.premiumEggs > 0);
    const ratios = eggPacks.map((p) => p.premiumEggs / p.priceKRW);
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
    }
  });

  it('상품 ID가 유니크해야 한다', () => {
    const ids = SHOP_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getProductById가 올바른 상품을 반환해야 한다', () => {
    expect(getProductById('coin_100')?.coins).toBe(100);
    expect(getProductById('premium_11')?.premiumEggs).toBe(14);
    expect(getProductById('nonexistent')).toBeUndefined();
  });

  it('모든 상품에 한국어/영어 이름이 있어야 한다', () => {
    for (const p of SHOP_PRODUCTS) {
      expect(p.nameKo).toBeTruthy();
      expect(p.nameEn).toBeTruthy();
    }
  });
});
