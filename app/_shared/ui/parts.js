'use client';

import { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { FiInbox } from 'react-icons/fi';
import ui from './ui.module.css';

export const cx = (...names) => names.filter(Boolean).join(' ');

export function Badge({ tone = 'neutral', children, title }) {
    return <span className={cx(ui.badge, ui[tone])} title={title}>{children}</span>;
}

export function Empty({ icon: Icon = FiInbox, title, children, action }) {
    return (
        <div className={ui.empty}>
            <Icon size={28} />
            <span className={ui.emptyTitle}>{title}</span>
            {children && <p style={{ margin: '0 auto', maxWidth: 420 }}>{children}</p>}
            {action && <div style={{ marginTop: 14 }}>{action}</div>}
        </div>
    );
}

export function SkeletonRows({ rows = 6, cols = 6 }) {
    return Array.from({ length: rows }, (_, r) => (
        <tr key={r}>
            {Array.from({ length: cols }, (__, c) => (
                <td key={c}><span className={ui.skeleton} style={{ width: `${50 + ((r * 7 + c * 13) % 45)}%` }} /></td>
            ))}
        </tr>
    ));
}

export function Pager({ page, totalPages, total, label = 'results', onPage, disabled }) {
    if (!total) return null;
    return (
        <div className={ui.pager}>
            <span>{total.toLocaleString('en-IN')} {total === 1 ? label.replace(/s$/, '') : label} · page {page} of {Math.max(1, totalPages)}</span>
            <div className={ui.pagerButtons}>
                <button className={cx(ui.btn, ui.btnSm)} disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
                <button className={cx(ui.btn, ui.btnSm)} disabled={disabled || page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
            </div>
        </div>
    );
}

// Right-side detail drawer. Closes on Escape and on overlay click.
export function Drawer({ open, onClose, title, subtitle, actions, children }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className={ui.overlay} onClick={onClose} role="presentation">
            <aside className={ui.drawer} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
                <div className={ui.drawerHead}>
                    <div style={{ minWidth: 0 }}>
                        <h3 className={ui.panelTitle} style={{ fontSize: 17 }}>{title}</h3>
                        {subtitle && <p className={ui.subtitle}>{subtitle}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {actions}
                        <button className={ui.iconBtn} onClick={onClose} aria-label="Close"><IoClose size={20} /></button>
                    </div>
                </div>
                <div className={ui.drawerBody}>{children}</div>
            </aside>
        </div>
    );
}

export function Thumb({ src, alt = '' }) {
    if (!src) return <span className={ui.thumb} aria-hidden="true" />;
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={ui.thumb} src={src} alt={alt} loading="lazy" />;
}

export function Initials({ name, img }) {
    if (img) {
        // eslint-disable-next-line @next/next/no-img-element
        return <span className={ui.avatar}><img src={img} alt="" /></span>;
    }
    const letters = String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return <span className={ui.avatar}>{letters || '?'}</span>;
}

// Re-runs `fn` after `delay` ms of no changes to `value`.
export function useDebouncedEffect(fn, deps, delay = 350) {
    useEffect(() => {
        const t = setTimeout(fn, delay);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
