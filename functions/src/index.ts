import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const rewardSecret = defineSecret("REWARD_HMAC_SECRET");
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

/* ─── 상품 정의 (shared/constants/shop.ts와 동기화) ─── */
interface ProductDef { coins: number; premiumEggs: number }
const PRODUCTS: Record<string, ProductDef> = {
  coin_100:    { coins: 100,  premiumEggs: 0 },
  coin_500:    { coins: 550,  premiumEggs: 0 },
  coin_1200:   { coins: 1400, premiumEggs: 0 },
  premium_1:   { coins: 0,    premiumEggs: 1 },
  premium_5:   { coins: 0,    premiumEggs: 6 },
  premium_11:  { coins: 0,    premiumEggs: 14 },
};

const PRODUCT_PRICES_KRW: Record<string, number> = {
  coin_100: 1200, coin_500: 5500, coin_1200: 12000,
  premium_1: 2500, premium_5: 11000, premium_11: 22000,
};

const MAX_DAILY_REWARDS = 3;
const AD_REWARD_PULLS = 10;
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/* ─── Helper: HMAC sign ─── */
function signToken(payload: object, secret: string): string {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");
  return `${payloadStr}.${sig}`;
}

function verifyToken(token: string, secret: string): { valid: boolean; payload?: any; reason?: string } {
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false, reason: "invalid_format" };

  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(payloadStr).digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, reason: "invalid_signature" };
    }
  } catch {
    return { valid: false, reason: "invalid_signature" };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString());
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: "invalid_payload" };
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ─── CORS helper ─── */
function setCors(res: any) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

/* ─── claimReward: 광고 시청 후 보상 토큰 발급 ─── */
export const claimReward = onRequest(
  { secrets: [rewardSecret], invoker: "public" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const secret = rewardSecret.value() || "dinotama-reward-fallback-secret";

    const uid = req.body?.uid || req.query.uid;
    if (!uid || typeof uid !== "string") {
      res.status(400).json({ error: "uid required" });
      return;
    }

    // Rate limit check
    const dailyRef = db.doc(`rewardClaims/${uid}/daily/${todayKey()}`);
    const dailySnap = await dailyRef.get();
    const currentCount = dailySnap.exists ? (dailySnap.data()?.count || 0) : 0;

    if (currentCount >= MAX_DAILY_REWARDS) {
      res.status(429).json({ error: "daily_limit", max: MAX_DAILY_REWARDS });
      return;
    }

    // Generate token
    const nonce = crypto.randomUUID();
    const payload = { uid, nonce, ts: Date.now(), pulls: AD_REWARD_PULLS };
    const token = signToken(payload, secret);

    // Store nonce for single-use validation
    await db.doc(`rewardTokens/${nonce}`).set({
      uid,
      used: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Increment daily count
    await dailyRef.set(
      { count: currentCount + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );

    // Return deep link URL
    const deepLink = `dinotama://reward?token=${encodeURIComponent(token)}`;
    res.json({ deepLink, token, remaining: MAX_DAILY_REWARDS - currentCount - 1 });
  },
);

/* ─── validateReward: 앱에서 토큰 검증 ─── */
export const validateReward = onRequest(
  { secrets: [rewardSecret], invoker: "public" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const secret = rewardSecret.value() || "dinotama-reward-fallback-secret";

    const token = req.body?.token || req.query.token;
    if (!token || typeof token !== "string") {
      res.status(400).json({ valid: false, reason: "token required" });
      return;
    }

    const result = verifyToken(token, secret);
    if (!result.valid) {
      res.status(400).json({ valid: false, reason: result.reason });
      return;
    }

    const { nonce, ts, uid, pulls } = result.payload;

    // Check expiry
    if (Date.now() - ts > TOKEN_EXPIRY_MS) {
      res.status(400).json({ valid: false, reason: "token_expired" });
      return;
    }

    // Check nonce (single-use)
    const nonceRef = db.doc(`rewardTokens/${nonce}`);
    const nonceSnap = await nonceRef.get();

    if (!nonceSnap.exists) {
      res.status(400).json({ valid: false, reason: "unknown_token" });
      return;
    }

    if (nonceSnap.data()?.used) {
      res.status(400).json({ valid: false, reason: "already_used" });
      return;
    }

    // Mark as used
    await nonceRef.update({ used: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ valid: true, uid, pulls });
  },
);

/* ═══════════════════════════════════════════════════════════════════
   Stripe 결제 시스템
   ═══════════════════════════════════════════════════════════════════ */

/** Checkout Session 생성 — 앱에서 호출 */
export const createCheckoutSession = onRequest(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const secret = stripeSecretKey.value();
    if (!secret) { res.status(500).json({ error: "Stripe not configured" }); return; }

    const stripe = new Stripe(secret);

    const { uid, productId } = req.body || {};
    if (!uid || !productId) {
      res.status(400).json({ error: "uid and productId required" });
      return;
    }

    const priceKRW = PRODUCT_PRICES_KRW[productId];
    const product = PRODUCTS[productId];
    if (!priceKRW || !product) {
      res.status(400).json({ error: "invalid productId" });
      return;
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "krw",
            product_data: {
              name: productId.startsWith("coin_") ? `DinoTama 코인 팩` : `DinoTama 프리미엄 알`,
              description: product.coins > 0
                ? `${product.coins} 코인`
                : `프리미엄 알 ${product.premiumEggs}개`,
            },
            unit_amount: priceKRW, // KRW는 소수점 없음
          },
          quantity: 1,
        }],
        mode: "payment",
        metadata: { uid, productId },
        success_url: "https://dinotama-dff44.web.app/payment-success.html",
        cancel_url: "https://dinotama-dff44.web.app/payment-cancel.html",
      });

      // 주문 기록
      await db.collection("orders").doc(session.id).set({
        uid,
        productId,
        sessionId: session.id,
        status: "pending",
        priceKRW,
        coins: product.coins,
        premiumEggs: product.premiumEggs,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("[Stripe] Checkout session error:", err.message);
      res.status(500).json({ error: "checkout_failed", message: err.message });
    }
  },
);

/** Stripe Webhook — 결제 완료 시 재화 지급 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret], invoker: "public" },
  async (req, res) => {
    const secret = stripeSecretKey.value();
    const whSecret = stripeWebhookSecret.value();
    if (!secret || !whSecret) { res.status(500).send("Not configured"); return; }

    const stripe = new Stripe(secret);
    const sig = req.headers["stripe-signature"];
    if (!sig) { res.status(400).send("Missing signature"); return; }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, whSecret);
    } catch (err: any) {
      console.error("[Stripe] Webhook signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { uid, productId } = session.metadata || {};

      if (!uid || !productId) {
        console.error("[Stripe] Missing metadata in session:", session.id);
        res.status(400).send("Missing metadata");
        return;
      }

      const product = PRODUCTS[productId];
      if (!product) {
        console.error("[Stripe] Unknown product:", productId);
        res.status(400).send("Unknown product");
        return;
      }

      // 유저 데이터에 재화 지급
      const userRef = db.doc(`users/${uid}`);
      try {
        await db.runTransaction(async (tx) => {
          const userSnap = await tx.get(userRef);
          const userData = userSnap.data() || {};

          const updates: Record<string, any> = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (product.coins > 0) {
            updates.coins = (userData.coins || 0) + product.coins;
          }
          if (product.premiumEggs > 0) {
            updates.premiumCurrency = (userData.premiumCurrency || 0) + product.premiumEggs;
          }

          tx.update(userRef, updates);
        });

        // 주문 상태 업데이트
        await db.doc(`orders/${session.id}`).update({
          status: "completed",
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[Stripe] Payment completed: uid=${uid}, product=${productId}, coins=${product.coins}, eggs=${product.premiumEggs}`);
      } catch (err: any) {
        console.error("[Stripe] Failed to grant items:", err.message);
        // 주문은 실패로 기록하되 Stripe에는 200 반환 (재시도 방지)
        await db.doc(`orders/${session.id}`).update({
          status: "grant_failed",
          error: err.message,
        });
      }
    }

    res.json({ received: true });
  },
);
