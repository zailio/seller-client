'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiBell, FiCheck, FiPackage, FiShoppingBag, FiMessageSquare, FiStar, FiHelpCircle, FiUsers, FiAlertTriangle } from 'react-icons/fi';
import styles from './bell.module.css';
import { bizPost } from '../../utils/bizApi';
import { timeAgo } from '../_shared/ui/format';

const POLL_MS = 60 * 1000; // unread count refresh; no extra realtime infrastructure needed

const ICONS = {
    seller_new_order: FiShoppingBag,
    seller_order_status: FiShoppingBag,
    seller_new_review: FiStar,
    seller_new_comment: FiMessageSquare,
    seller_new_question: FiHelpCircle,
    seller_low_stock: FiAlertTriangle,
    seller_distributor_request: FiUsers,
    seller_distributor_decision: FiUsers,
};

// Top-right bell: unread badge, dropdown, mark read / all read, full history with paging,
// and navigation to the related screen (`onNavigate(tab, ref)`).
export default function NotificationBell({ auth, session, onNavigate }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [onlyUnread, setOnlyUnread] = useState(false);
    const root = useRef(null);

    const refreshCount = useCallback(() => {
        bizPost('notifications/unread-count', creds).then((d) => setUnread(d.unread)).catch(() => { });
    }, [creds]);

    useEffect(() => {
        refreshCount();
        const t = setInterval(() => {
            if (document.visibilityState === 'visible') refreshCount();
        }, POLL_MS);
        return () => clearInterval(t);
    }, [refreshCount]);

    const loadPage = useCallback(async (p, unreadOnly) => {
        setLoading(true);
        try {
            const d = await bizPost('notifications/list', creds, { page: p, limit: 15, unread_only: unreadOnly });
            setItems((prev) => (p === 1 ? d.list : [...prev, ...d.list]));
            setPage(p);
            setHasMore(d.has_more);
        } catch (e) {
            // the bell is non-critical; keep the dashboard usable
        } finally {
            setLoading(false);
        }
    }, [creds]);

    useEffect(() => {
        if (open) loadPage(1, onlyUnread);
    }, [open, onlyUnread, loadPage]);

    useEffect(() => {
        if (!open) return undefined;
        const close = (e) => { if (root.current && !root.current.contains(e.target)) setOpen(false); };
        const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);

    const markRead = async (ids) => {
        if (!ids.length) return;
        setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
        setUnread((u) => Math.max(0, u - ids.length));
        try {
            await bizPost('notifications/mark-read', creds, { ids });
        } finally {
            refreshCount();
        }
    };

    const markAll = async () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
        try {
            await bizPost('notifications/mark-all-read', creds);
        } finally {
            refreshCount();
        }
    };

    const openItem = (n) => {
        if (!n.read) markRead([n.id]);
        if (n.ref?.tab && onNavigate) {
            onNavigate(n.ref.tab, n.ref);
            setOpen(false);
        }
    };

    return (
        <div className={styles.root} ref={root}>
            <button
                className={styles.bell}
                onClick={() => setOpen((v) => !v)}
                aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
                aria-expanded={open}
            >
                <FiBell size={19} />
                {unread > 0 && <span className={styles.count}>{unread > 99 ? '99+' : unread}</span>}
            </button>

            {open && (
                <div className={styles.panel} role="dialog" aria-label="Notifications">
                    <div className={styles.head}>
                        <strong>Notifications</strong>
                        <div className={styles.headActions}>
                            <label className={styles.toggle}>
                                <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> Unread only
                            </label>
                            <button className={styles.link} onClick={markAll} disabled={!unread}><FiCheck size={13} /> Mark all read</button>
                        </div>
                    </div>
                    <div className={styles.list}>
                        {items.map((n) => {
                            const Icon = ICONS[n.event] || FiPackage;
                            return (
                                <button key={n.id} className={styles.item} data-unread={!n.read} onClick={() => openItem(n)}>
                                    <span className={styles.icon} data-event={n.event}><Icon size={15} /></span>
                                    <span className={styles.text}>
                                        <span className={styles.title}>{n.title}</span>
                                        {n.body && <span className={styles.body}>{n.body}</span>}
                                        <span className={styles.time}>{timeAgo(n.createdAt)}</span>
                                    </span>
                                    {!n.read && <span className={styles.dot} aria-label="Unread" />}
                                </button>
                            );
                        })}
                        {!loading && !items.length && (
                            <div className={styles.empty}>
                                <FiBell size={22} />
                                <span>{onlyUnread ? 'No unread notifications' : 'No notifications yet'}</span>
                                <small>New orders, reviews, comments, questions and stock alerts show up here.</small>
                            </div>
                        )}
                        {loading && <div className={styles.loading}>Loading…</div>}
                        {hasMore && !loading && (
                            <button className={styles.more} onClick={() => loadPage(page + 1, onlyUnread)}>Show older notifications</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
