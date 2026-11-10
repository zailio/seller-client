'use client';
import { useState } from 'react';
import { FiEye, FiEyeOff, FiCopy, FiTrash2, FiArrowUp, FiArrowDown, FiStar } from 'react-icons/fi';
import { useSf } from './ctx';
import { resolveLink } from '../lib/links';
import { formatPrice } from '../lib/utils';
import base from './base.module.css';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function useHref() {
  const { linkCtx } = useSf();
  return (l) => resolveLink(l, linkCtx);
}

/** `<a>` that degrades to a `<span>` when there is no link */
export function SfLink({ link, className, children, style, ...rest }) {
  const href = useHref()(link);
  if (!href) return <span className={className} style={style} {...rest}>{children}</span>;
  const external = /^https?:\/\//.test(href);
  return (
    <a className={className} style={style} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  );
}

export function sectionTitleBlock(title, subtitle) {
  if (!title && !subtitle) return null;
  return (
    <div className={base.head}>
      {title ? <h2 className={base.title}>{title}</h2> : null}
      {subtitle ? <p className={base.subtitle}>{subtitle}</p> : null}
    </div>
  );
}

const same = (a, b) => a && b && a.type === b.type && (a.id || null) === (b.id || null);

/** Wraps a block; in the Studio it adds the click-to-select outline + floating toolbar. */
export function Block({ target, label, className, children, sticky, hidden }) {
  const { editor } = useSf();
  if (!editor) return <div className={cx(className, sticky && base.sticky)}>{children}</div>;
  const selected = same(editor.selected, target);
  const isSection = target.type === 'section';
  const act = editor.actions || {};
  const stop = (fn) => (e) => { e.stopPropagation(); e.preventDefault(); fn(); };
  return (
    <div
      className={cx(className, base.editBlock, selected && base.editSelected, hidden && base.editHidden, sticky && base.sticky)}
      data-sf-block={target.type} data-sf-id={target.id || ""}
      onClick={(e) => { e.stopPropagation(); editor.onSelect?.(target); }}
    >
      {children}
      <div className={cx(base.editTag, selected && base.editTagOn)}>
        <span className={base.editLabel}>{label}{hidden ? ' · hidden' : ''}</span>
        {isSection && (
          <span className={base.editActions}>
            <button type="button" title="Move up" onClick={stop(() => act.move?.(target.id, -1))}><FiArrowUp /></button>
            <button type="button" title="Move down" onClick={stop(() => act.move?.(target.id, 1))}><FiArrowDown /></button>
            <button type="button" title={hidden ? 'Show' : 'Hide'} onClick={stop(() => act.toggle?.(target.id))}>{hidden ? <FiEye /> : <FiEyeOff />}</button>
            <button type="button" title="Duplicate" onClick={stop(() => act.duplicate?.(target.id))}><FiCopy /></button>
            <button type="button" title="Delete" onClick={stop(() => act.remove?.(target.id))}><FiTrash2 /></button>
          </span>
        )}
      </div>
    </div>
  );
}

export function Stars({ value = 5 }) {
  return (
    <span className={base.stars} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <FiStar key={i} className={i <= value ? base.starOn : base.starOff} />)}
    </span>
  );
}

/** Image with a branded gradient fallback so empty slots still look designed */
export function Media({ src, alt = '', className, seed = 0, children, style }) {
  const [broken, setBroken] = useState(false);
  const has = src && !broken;
  return (
    <div className={cx(base.media, className, !has && base[`ph${Math.abs(seed) % 4}`])} style={style}>
      {has ? <img src={src} alt={alt} loading="lazy" draggable={false} onError={() => setBroken(true)} /> : null}
      {children}
    </div>
  );
}

export const seedOf = (s = '') => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0);

export function priceInfo(p) {
  const mrp = Number(p.price) || 0;
  const sell = Number(p.discount) > 0 ? Number(p.discount) : mrp;
  const off = mrp > sell && mrp > 0 ? Math.round((1 - sell / mrp) * 100) : 0;
  return { mrp, sell, off, sellText: formatPrice(sell), mrpText: off ? formatPrice(mrp) : '' };
}
