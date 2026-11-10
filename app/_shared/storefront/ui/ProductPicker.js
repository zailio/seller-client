'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import { SAMPLE_PRODUCTS } from '../renderer/sample';
import { formatPrice, debounce } from '../lib/utils';
import pal from '../panels/panels.module.css';
import m from './modal.module.css';
import { st, cx } from './controls';

export default function ProductPicker({ request, products, onClose }) {
  const { title = 'Choose products', multiple = true, selected = [], onConfirm } = request;
  const [picked, setPicked] = useState(() => selected.map(String));
  const [q, setQ] = useState('');
  const searchRef = useRef(null);
  if (!searchRef.current) searchRef.current = debounce((v) => products.search(v), 350);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const usingSamples = !products.loading && products.items.length === 0 && !q;
  const list = usingSamples ? SAMPLE_PRODUCTS : products.items;
  const byId = useMemo(() => Object.fromEntries(list.map((p) => [p.id, p])), [list]);

  const toggle = (id) => setPicked((cur) => (multiple ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]));
  const done = () => {
    const chosen = picked.map((id) => byId[id] || products.items.find((p) => p.id === id)).filter(Boolean);
    onConfirm?.(chosen);
    onClose();
  };

  return (
    <div className={m.overlay} onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className={m.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={m.head}>
          <div><h3 className={m.title}>{title}</h3><div className={m.sub}>{multiple ? `${picked.length} selected` : 'Pick one'}</div></div>
          <button type="button" className={st.iconAction} onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <div className={m.search}>
          <FiSearch />
          <input autoFocus placeholder="Search by name or SKU…" value={q} onChange={(e) => { setQ(e.target.value); searchRef.current(e.target.value); }} />
        </div>
        {usingSamples && <div className={m.note}>No products found yet — showing sample products so you can try the picker.</div>}
        <div className={m.body}>
          {products.loading && !list.length ? <div className={m.state}><span className={st.spin} /></div> : null}
          {!products.loading && !list.length ? <div className={m.state}>No products match “{q}”.</div> : null}
          <div className={m.grid}>
            {list.map((p) => {
              const on = picked.includes(p.id);
              return (
                <button key={p.id} type="button" className={cx(pal.pick, on && pal.pickOn)} onClick={() => toggle(p.id)}>
                  <span className={pal.pickImg}>{p.image ? <img src={p.image} alt="" /> : p.title.charAt(0)}</span>
                  <span className={pal.pickMeta}>
                    <span className={pal.pickTitle}>{p.title}</span>
                    <span className={pal.pickPrice}>{formatPrice(p.discount)}{p.price > p.discount ? ` · MRP ${formatPrice(p.price)}` : ''}</span>
                  </span>
                  <span className={cx(pal.check, on && pal.checkOn)}>{on ? <FiCheck /> : null}</span>
                </button>
              );
            })}
          </div>
          {products.hasMore && !usingSamples ? <button type="button" className={cx(st.btn, st.btnBlock)} style={{ marginTop: 10 }} onClick={products.loadMore} disabled={products.loading}>{products.loading ? 'Loading…' : 'Load more'}</button> : null}
        </div>
        <div className={m.foot}>
          <button type="button" className={st.btn} onClick={onClose}>Cancel</button>
          <button type="button" className={cx(st.btn, st.btnPrimary)} onClick={done} disabled={!picked.length}>{multiple ? `Add ${picked.length || ''} product${picked.length === 1 ? '' : 's'}` : 'Choose product'}</button>
        </div>
      </div>
    </div>
  );
}
