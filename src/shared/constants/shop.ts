/** DinoTama 상점 상품 정의 */

export interface ShopProduct {
  id: string;
  nameKo: string;
  nameEn: string;
  description: string;
  priceKRW: number;       // 원화 가격
  coins: number;          // 지급 코인 (0이면 프리미엄 알)
  premiumEggs: number;    // 지급 프리미엄 알 (0이면 코인)
  bonus: string;          // 보너스 표시 텍스트
  tag?: 'best' | 'popular'; // 뱃지
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  // ── 코인 팩 ──
  {
    id: 'coin_100',
    nameKo: '코인 주머니',
    nameEn: 'Coin Pouch',
    description: '가챠 10회분',
    priceKRW: 1200,
    coins: 100,
    premiumEggs: 0,
    bonus: '',
  },
  {
    id: 'coin_500',
    nameKo: '코인 상자',
    nameEn: 'Coin Box',
    description: '가챠 50회분 + 보너스',
    priceKRW: 5500,
    coins: 550,
    premiumEggs: 0,
    bonus: '+50 보너스',
    tag: 'popular',
  },
  {
    id: 'coin_1200',
    nameKo: '코인 금고',
    nameEn: 'Coin Vault',
    description: '가챠 120회분 + 대량 보너스',
    priceKRW: 12000,
    coins: 1400,
    premiumEggs: 0,
    bonus: '+200 보너스',
    tag: 'best',
  },

  // ── 프리미엄 알 팩 (레전드 이상 확률 2배) ──
  {
    id: 'premium_1',
    nameKo: '프리미엄 알 1개',
    nameEn: 'Premium Egg ×1',
    description: 'Legend/Hidden 확률 2배',
    priceKRW: 2500,
    coins: 0,
    premiumEggs: 1,
    bonus: '',
  },
  {
    id: 'premium_5',
    nameKo: '프리미엄 알 5+1개',
    nameEn: 'Premium Egg ×5+1',
    description: 'Legend/Hidden 확률 2배',
    priceKRW: 11000,
    coins: 0,
    premiumEggs: 6,
    bonus: '+1 보너스',
    tag: 'popular',
  },
  {
    id: 'premium_11',
    nameKo: '프리미엄 알 11+3개',
    nameEn: 'Premium Egg ×11+3',
    description: 'Legend/Hidden 확률 2배 + Legend 1회 확정',
    priceKRW: 22000,
    coins: 0,
    premiumEggs: 14,
    bonus: '+3 보너스 + Legend 확정 1회',
    tag: 'best',
  },
];

/** 상품 ID로 조회 */
export function getProductById(id: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.id === id);
}
