'use client';

// Building blocks for the role overviews (seller strip, brand overview, distributor overview).
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiMessageSquare, FiTruck, FiBell } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import styles from './overview.module.css';
import { bizPost } from '../../../utils/bizApi';
import { compactRupees } from '../ui/format';
import { cx } from '../ui/parts';

export { styles as overviewStyles };

export function useOverview(creds, addNotification) {
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        let cancelled = false;
        bizPost('overview', creds)
            .then((d) => { if (!cancelled) setOverview(d.overview); })
            .catch((err) => {
                if (cancelled) return;
                setError(true);
                if (addNotification) addNotification({ h2: 'Overview', desc: err.message, tag: 'error' });
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds]);
    return { overview, error };
}

// "Needs attention" strip: each tile jumps to the screen that resolves it.
export function Attention({ overview, onNavigate, extra = [] }) {
    const tiles = [
        ...extra,
        { key: 'fulfil', icon: FiTruck, value: overview.orders_to_fulfil, label: 'orders to fulfil', tab: 'orders' },
        { key: 'feedback', icon: FiMessageSquare, value: overview.feedback.unanswered, label: 'unanswered feedback', tab: 'feedback:questions' },
        { key: 'stock', icon: FiAlertTriangle, value: overview.products.low_stock, label: 'low or out of stock', tab: 'products', danger: true },
        { key: 'bell', icon: FiBell, value: overview.unread_notifications, label: 'unread notifications', tab: null },
    ];
    return (
        <div className={styles.attention}>
            {tiles.map((t) => (
                <button
                    key={t.key}
                    className={cx(styles.tile, t.value > 0 && (t.danger ? styles.tileDanger : styles.tileActive))}
                    onClick={() => t.tab && onNavigate && onNavigate(t.tab)}
                    disabled={!t.tab}
                >
                    <t.icon size={17} />
                    <span className={styles.tileValue}>{t.value}</span>
                    <span className={styles.tileLabel}>{t.label}</span>
                </button>
            ))}
        </div>
    );
}

export function SalesCards({ sales, profitLabel = 'Profit (30 days)' }) {
    return (
        <div className={ui.cards}>
            <div className={ui.card}>
                <span className={ui.cardLabel}>Today</span>
                <span className={ui.cardValue}>{compactRupees(sales.today.sold)}</span>
                <span className={ui.cardHint}>{sales.today.orders} order{sales.today.orders === 1 ? '' : 's'}</span>
            </div>
            <div className={ui.card}>
                <span className={ui.cardLabel}>Last 7 days</span>
                <span className={ui.cardValue}>{compactRupees(sales.week.sold)}</span>
                <span className={ui.cardHint}>{sales.week.orders} orders</span>
            </div>
            <div className={ui.card}>
                <span className={ui.cardLabel}>Last 30 days</span>
                <span className={ui.cardValue}>{compactRupees(sales.month.sold)}</span>
                <span className={ui.cardHint}>{sales.month.orders} orders</span>
            </div>
            <div className={cx(ui.card, ui.cardAccent)}>
                <span className={ui.cardLabel}>{profitLabel}</span>
                <span className={cx(ui.cardValue, sales.month.profit < 0 && ui.negative)}>{compactRupees(sales.month.profit)}</span>
                <span className={ui.cardHint}>{compactRupees(sales.month.estimated_profit)} still estimated</span>
            </div>
        </div>
    );
}

export function OverviewSkeleton() {
    return (
        <div className={ui.page}>
            <span className={ui.skeleton} style={{ width: 240, height: 24, marginBottom: 24 }} />
            <div className={ui.cards}>
                {[0, 1, 2, 3].map((i) => <div key={i} className={ui.card}><span className={ui.skeleton} style={{ width: '50%' }} /><span className={ui.skeleton} style={{ width: '70%', height: 22, marginTop: 10 }} /></div>)}
            </div>
        </div>
    );
}
