import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

// Replace with actual publishable key
const STRIPE_PUBLISHABLE_KEY = '';

function getStripe() {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export interface PremiumEggProduct {
  id: string;
  name: string;
  priceId: string;
  amount: number;       // in cents
  eggCount: number;     // number of premium eggs
}

export const PREMIUM_PRODUCTS: PremiumEggProduct[] = [
  { id: 'egg_1', name: '고급알 1개', priceId: '', amount: 100, eggCount: 1 },
  { id: 'egg_5', name: '고급알 5개', priceId: '', amount: 450, eggCount: 5 },
  { id: 'egg_11', name: '고급알 11개 (1개 보너스)', priceId: '', amount: 900, eggCount: 11 },
];

/**
 * Redirect to Stripe Checkout for premium egg purchase.
 * In production, the checkout session should be created server-side.
 * This is a simplified client-only flow for development.
 */
export async function purchasePremiumEggs(product: PremiumEggProduct): Promise<boolean> {
  const stripe = await getStripe();
  if (!stripe) {
    console.error('[Stripe] Not initialized — missing publishable key');
    return false;
  }

  // In production: call your backend to create a checkout session
  // const response = await fetch('/api/create-checkout-session', { ... });
  // const { sessionId } = await response.json();
  // await stripe.redirectToCheckout({ sessionId });

  console.log(`[Stripe] Would purchase: ${product.name} (${product.amount} cents)`);
  return false;
}

export { getStripe };
