import React, { useState, useCallback } from 'react';
import { SHOP_PRODUCTS, type ShopProduct } from '@shared/constants';
import { openCheckout } from '../services/stripe';
import { useT } from '../hooks/useT';

interface ShopPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userUid: string | null;
}

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  best: { bg: '#fbbf24', color: '#000', label: 'BEST' },
  popular: { bg: '#60a5fa', color: '#fff', label: 'HOT' },
};

export function ShopPanel({ isOpen, onClose, userUid }: ShopPanelProps) {
  const t = useT();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = useCallback(async (product: ShopProduct) => {
    if (!userUid) { setError(t.shop.loginRequired); return; }
    setLoading(product.id);
    setError(null);
    try {
      const success = await openCheckout(userUid, product.id);
      if (!success) setError(t.shop.checkoutFailed);
    } catch {
      setError(t.shop.checkoutFailed);
    } finally {
      setLoading(null);
    }
  }, [userUid, t]);

  if (!isOpen) return null;

  const coinProducts = SHOP_PRODUCTS.filter((p) => p.coins > 0);
  const premiumProducts = SHOP_PRODUCTS.filter((p) => p.premiumEggs > 0);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'rgb(15, 15, 25)', display: 'flex', flexDirection: 'column',
      color: '#e2e8f0', fontSize: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{t.shop.title}</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#94a3b8',
          cursor: 'pointer', fontSize: 16, padding: '0 2px',
        }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* 코인 팩 */}
        <SectionHeader icon="💰" title={t.shop.coinPacks} />
        {coinProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            loading={loading === p.id}
            onBuy={() => handlePurchase(p)}
          />
        ))}

        {/* 프리미엄 알 */}
        <SectionHeader icon="✨" title={t.shop.premiumEggs} />
        {premiumProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            loading={loading === p.id}
            onBuy={() => handlePurchase(p)}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 14px', background: 'rgba(239,68,68,0.15)',
          color: '#ef4444', fontSize: 10, textAlign: 'center',
          borderTop: '1px solid rgba(239,68,68,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 9, color: '#475569', textAlign: 'center',
      }}>
        {t.shop.footer}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{
      padding: '10px 14px 4px', fontSize: 11, fontWeight: 700,
      color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {icon} {title}
    </div>
  );
}

function ProductCard({ product, loading, onBuy }: { product: ShopProduct; loading: boolean; onBuy: () => void }) {
  const [hover, setHover] = useState(false);
  const lang = localStorage.getItem('dinotama-lang') || 'ko';
  const name = lang === 'en' ? product.nameEn : product.nameKo;
  const tag = product.tag ? TAG_STYLES[product.tag] : null;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        margin: '4px 10px', padding: '10px 12px', borderRadius: 10,
        background: hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'all 0.15s', position: 'relative',
      }}
    >
      {/* Tag badge */}
      {tag && (
        <div style={{
          position: 'absolute', top: -6, right: 10,
          background: tag.bg, color: tag.color,
          fontSize: 8, fontWeight: 800, padding: '1px 6px',
          borderRadius: 4, letterSpacing: 0.5,
        }}>
          {tag.label}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0' }}>{name}</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
          {product.coins > 0 ? `💰 ${product.coins} 코인` : `🥚 프리미엄 알 ×${product.premiumEggs}`}
        </div>
        {product.bonus && (
          <div style={{ fontSize: 9, color: '#fbbf24', marginTop: 1 }}>
            {product.bonus}
          </div>
        )}
      </div>

      {/* Buy button */}
      <button
        onClick={onBuy}
        disabled={loading}
        style={{
          padding: '6px 14px', borderRadius: 8, border: 'none',
          background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fbbf24, #f97316)',
          color: loading ? '#64748b' : '#000',
          fontSize: 11, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '...' : `₩${product.priceKRW.toLocaleString()}`}
      </button>
    </div>
  );
}
