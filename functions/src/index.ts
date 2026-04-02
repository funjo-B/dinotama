import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();

const rewardSecret = defineSecret("REWARD_HMAC_SECRET");

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
