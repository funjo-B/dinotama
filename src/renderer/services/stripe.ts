import { SHOP_PRODUCTS, type ShopProduct } from '@shared/constants';

const FUNCTIONS_BASE = 'https://us-central1-dinotama-dff44.cloudfunctions.net';

export { SHOP_PRODUCTS, type ShopProduct };

/** Stripe Checkout 세션을 생성하고 결제 페이지 URL 반환 */
export async function createCheckout(uid: string, productId: string): Promise<{ url: string; sessionId: string } | null> {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/createCheckoutSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, productId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Stripe] Checkout failed:', err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[Stripe] Network error:', err);
    return null;
  }
}

/** 결제 페이지를 외부 브라우저로 열기 */
export async function openCheckout(uid: string, productId: string): Promise<boolean> {
  const result = await createCheckout(uid, productId);
  if (!result?.url) return false;

  // Electron에서 외부 브라우저로 열기
  window.dinoAPI?.openExternal?.(result.url);
  return true;
}
