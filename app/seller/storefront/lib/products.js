'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import config from '../../../../utils/config';

/** Normalise the many shapes a product can have in the seller APIs.
 *  Field semantics (platform convention): `discount` = selling price, `price` = MRP. */
export function normalizeProduct(p = {}) {
  const img = Array.isArray(p.image) ? p.image[0] : p.image || p.img || (Array.isArray(p.images) ? p.images[0] : '');
  const mrp = Number(p.price) || 0;
  const sell = Number(p.discount) > 0 ? Number(p.discount) : mrp;
  return {
    id: String(p.id ?? p.product_id ?? p.sku ?? ''),
    sku: p.sku || '',
    title: p.title || p.name || 'Untitled product',
    subtitle: p.subtitle || '',
    image: typeof img === 'string' ? img : img?.url || '',
    price: mrp || sell,
    discount: sell,
    isAvailable: p.isAvailable !== false && p.isAvailable !== 0,
  };
}

async function post(ctx, path, body) {
  const res = await fetch(config.SERVER_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.auth}` },
    body: JSON.stringify({ session_id: ctx.session, ...body }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  const d = json?.data ?? json;
  if (!d || d.status === false) throw new Error('request failed');
  return d;
}

/** Loads the seller's products and exposes search + load more. Empty list on failure (renderer shows samples). */
export function useSellerProducts(ctx, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const page = useRef(1);
  const seq = useRef(0);

  const loadFirst = useCallback(async () => {
    if (config.demo) return;
    const id = ++seq.current;
    setLoading(true);
    setError(false);
    page.current = 1;
    try {
      const d = await post(ctx, '/seller/product_manage', {});
      if (id !== seq.current) return;
      setItems((d.list || []).map(normalizeProduct));
      setTotal(d.count || (d.list || []).length);
    } catch {
      if (id === seq.current) setError(true);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [ctx.auth, ctx.session]);

  useEffect(() => {
    if (enabled) loadFirst();
  }, [enabled, loadFirst]);

  const search = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) return loadFirst();
    const id = ++seq.current;
    setLoading(true);
    try {
      const d = await post(ctx, '/seller/search-manage-product', { query: q });
      if (id !== seq.current) return;
      setItems((d.list || []).map(normalizeProduct));
      setTotal((d.list || []).length);
    } catch {
      if (id === seq.current) setError(true);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [ctx.auth, ctx.session, loadFirst]);

  const loadMore = useCallback(async () => {
    if (query.trim() || loading) return;
    setLoading(true);
    try {
      const next = page.current + 1;
      const d = await post(ctx, '/seller/next-page-product', { filter: false, page: next });
      const list = (d.list || []).map(normalizeProduct);
      if (list.length) {
        page.current = next;
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...list.filter((p) => !seen.has(p.id))];
        });
      } else {
        setTotal((t) => Math.min(t, items.length));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [ctx.auth, ctx.session, query, loading, items.length]);

  return { items, total, loading, error, query, search, loadMore, reload: loadFirst, hasMore: !query.trim() && items.length < total };
}
