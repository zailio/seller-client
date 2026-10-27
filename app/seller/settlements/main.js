'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FiCreditCard, FiTrendingUp, FiPauseCircle, FiClock, FiCheckCircle, FiDownload,
    FiRefreshCw, FiSearch, FiX, FiCopy, FiAlertCircle, FiInfo, FiChevronRight,
    FiCalendar, FiInbox, FiHome, FiCheck, FiFilter,
} from 'react-icons/fi';
import styles from './page.module.css';

/* ------------------------------------------------------------------ */
/* MOCK DATA                                                           */
/* Replace `api.getSettlements` with your real endpoint, for example   */
/*   GET /seller/settlements?session_id=...                            */
/* and keep the row shape below.                                       */
/*                                                                     */
/* Row shape (after build()):                                          */
/* { id, start, end, payout, status, orders, gross, returns,           */
/*   commission, commission_gst, shipping, tcs, tds, adjustments,      */
/*   adjustment_note, net, deductions, utr, hold_reason }              */
/* status: 'settled' | 'processing' | 'scheduled' | 'hold'             */
/* ------------------------------------------------------------------ */
const MOCK_NOW = new Date('2026-10-27T10:45:00+05:30');

const RATES = { commission: 0.08, gst: 0.18, shippingPerOrder: 58.5, tcs: 0.005, tds: 0.001 };

const BANK = {
    name: 'HDFC Bank',
    holder: 'Zailio Demo Store',
    last4: '4821',
    ifsc: 'HDFC0001234',
    verified: true,
};

const RAW = [
    { id: 'STL-2026-W43', start: '2026-10-19', end: '2026-10-25', payout: '2026-10-30', status: 'scheduled', orders: 64, gross: 182450, returns: 6890 },
    { id: 'STL-2026-W42', start: '2026-10-12', end: '2026-10-18', payout: '2026-10-27', status: 'processing', orders: 71, gross: 204780, returns: 9120 },
    { id: 'STL-2026-W41', start: '2026-10-05', end: '2026-10-11', payout: '2026-10-20', status: 'settled', orders: 58, gross: 161200, returns: 4350, utr: 'HDFCR52026102038417' },
    { id: 'STL-2026-W40', start: '2026-09-28', end: '2026-10-04', payout: '2026-10-13', status: 'settled', orders: 49, gross: 138640, returns: 7210, adjustments: 500, adjustment_note: 'Packaging damage claim on order ZL482913', utr: 'HDFCR52026101327764' },
    { id: 'STL-2026-W39', start: '2026-09-21', end: '2026-09-27', payout: null, status: 'hold', orders: 53, gross: 149900, returns: 5640, hold_reason: 'The name on your PAN document does not match the bank account holder. Re-upload a clear PAN copy in Profile to release this payout.' },
    { id: 'STL-2026-W38', start: '2026-09-14', end: '2026-09-20', payout: '2026-09-29', status: 'settled', orders: 62, gross: 176320, returns: 8480, utr: 'HDFCR52026092961025' },
    { id: 'STL-2026-W37', start: '2026-09-07', end: '2026-09-13', payout: '2026-09-22', status: 'settled', orders: 45, gross: 121750, returns: 3120, utr: 'HDFCR52026092244190' },
    { id: 'STL-2026-W36', start: '2026-08-31', end: '2026-09-06', payout: '2026-09-15', status: 'settled', orders: 57, gross: 158900, returns: 6240, utr: 'HDFCR52026091580336' },
    { id: 'STL-2026-W35', start: '2026-08-24', end: '2026-08-30', payout: '2026-09-08', status: 'settled', orders: 41, gross: 109480, returns: 2980, utr: 'HDFCR52026090873518' },
    { id: 'STL-2026-W34', start: '2026-08-17', end: '2026-08-23', payout: '2026-09-01', status: 'settled', orders: 38, gross: 98650, returns: 4410, utr: 'HDFCR52026090119872' },
    { id: 'STL-2026-W33', start: '2026-08-10', end: '2026-08-16', payout: '2026-08-25', status: 'settled', orders: 44, gross: 117320, returns: 3870, utr: 'HDFCR52026082562741' },
    { id: 'STL-2026-W32', start: '2026-08-03', end: '2026-08-09', payout: '2026-08-18', status: 'settled', orders: 36, gross: 92100, returns: 2150, utr: 'HDFCR52026081835206' },
];

const round2 = (n) => Math.round(n * 100) / 100;

// every figure is derived from gross, returns and orders, so the numbers always add up
const build = (r) => {
    const base = r.gross - r.returns;
    const commission = round2(base * RATES.commission);
    const commission_gst = round2(commission * RATES.gst);
    const shipping = round2(r.orders * RATES.shippingPerOrder);
    const tcs = round2(base * RATES.tcs);
    const tds = round2(base * RATES.tds);
    const adjustments = r.adjustments || 0;
    const net = round2(base - commission - commission_gst - shipping - tcs - tds - adjustments);
    return {
        utr: null,
        hold_reason: null,
        adjustment_note: null,
        ...r,
        adjustments,
        commission,
        commission_gst,
        shipping,
        tcs,
        tds,
        net,
        deductions: round2(r.gross - net),
    };
};

const api = {
    async getSettlements() {
        await new Promise((resolve) => setTimeout(resolve, 700));
        return RAW.map(build);
    },
};

/* sample order lines for the detail drawer */
const PRODUCTS = ['Cotton Kurta Set', 'Wireless Earbuds', 'Steel Water Bottle', 'Yoga Mat', 'Ceramic Mug Set', 'LED Desk Lamp', 'Running Shoes', 'Backpack 30L'];
const hashStr = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const lcg = (x) => (Math.imul(x, 1664525) + 1013904223) >>> 0;

const makeOrders = (s) => {
    let x = hashStr(s.id);
    const first = new Date(`${s.start}T12:00:00`).getTime();
    return Array.from({ length: Math.min(s.orders, 6) }, (_, i) => {
        x = lcg(x);
        const product = PRODUCTS[x % PRODUCTS.length];
        x = lcg(x);
        const amount = 449 + (x % 40) * 75;
        x = lcg(x);
        const date = first + (x % 7) * 86400000;
        x = lcg(x);
        return {
            id: `ZL${100000 + (x % 900000)}`,
            date,
            product,
            amount,
            commission: round2(amount * RATES.commission),
            returned: i % 5 === 4,
        };
    });
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 8;

const STATUS = {
    settled: { label: 'Settled', cls: 'pillOk' },
    processing: { label: 'Processing', cls: 'pillInfo' },
    scheduled: { label: 'Scheduled', cls: 'pillWarn' },
    hold: { label: 'On hold', cls: 'pillDanger' },
};

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'settled', label: 'Settled' },
    { value: 'processing', label: 'Processing' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'hold', label: 'On hold' },
];

const RANGES = [
    { value: 'all', label: 'All time', days: null },
    { value: '30', label: 'Last 30 days', days: 30 },
    { value: '60', label: 'Last 60 days', days: 60 },
];

const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'net_desc', label: 'Highest payout' },
    { value: 'net_asc', label: 'Lowest payout' },
];

const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDate = (iso) => new Date(`${iso}T00:00:00`);

const fmtDate = (v) =>
    v ? toDate(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtShort = (v) => toDate(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const fmtPeriod = (s, e) => `${fmtShort(s)} – ${fmtDate(e)}`;

const fmtOrderDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const startOfToday = () => new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth(), MOCK_NOW.getDate());

const daysUntil = (iso) => Math.round((toDate(iso).getTime() - startOfToday().getTime()) / 86400000);

const whenLabel = (iso) => {
    const d = daysUntil(iso);
    if (d === 0) return 'Today';
    if (d === 1) return 'Tomorrow';
    if (d > 1) return `In ${d} days`;
    return fmtDate(iso);
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (name, text) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const breakdownOf = (s) => [
    { key: 'gross', label: 'Gross sales', note: `${s.orders} orders`, value: s.gross, sign: '+' },
    { key: 'returns', label: 'Returns and refunds', value: s.returns, sign: '-' },
    { key: 'commission', label: 'Platform commission', note: `${RATES.commission * 100}% of net sales`, value: s.commission, sign: '-' },
    { key: 'gst', label: 'GST on commission', note: `${RATES.gst * 100}%`, value: s.commission_gst, sign: '-' },
    { key: 'shipping', label: 'Shipping charges', note: `${inr2.format(RATES.shippingPerOrder)} per order`, value: s.shipping, sign: '-' },
    { key: 'tcs', label: 'TCS (GST)', note: `${RATES.tcs * 100}%`, value: s.tcs, sign: '-' },
    { key: 'tds', label: 'TDS (194-O)', note: `${RATES.tds * 100}%`, value: s.tds, sign: '-' },
    ...(s.adjustments > 0
        ? [{ key: 'adj', label: 'Adjustments', note: s.adjustment_note, value: s.adjustments, sign: '-' }]
        : []),
];

/* ------------------------------------------------------------------ */
/* DETAIL DRAWER                                                       */
/* ------------------------------------------------------------------ */
const Drawer = ({ s, onClose, onCopy, copied, onStatement }) => {
    const closeRef = useRef(null);
    const orders = useMemo(() => makeOrders(s), [s]);
    const meta = STATUS[s.status];

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <aside
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-label={`Settlement ${s.id}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.drawerHead}>
                    <div>
                        <div className={styles.drawerIdRow}>
                            <h3>{s.id}</h3>
                            <span className={styles[meta.cls]}>{meta.label}</span>
                        </div>
                        <p>{fmtPeriod(s.start, s.end)}</p>
                    </div>
                    <button ref={closeRef} type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <div className={styles.drawerBody}>
                    <div className={styles.netCard}>
                        <span>{s.status === 'settled' ? 'Paid to your bank' : 'Net payout'}</span>
                        <strong>{inr2.format(s.net)}</strong>
                        <small>
                            {s.status === 'hold'
                                ? 'Payout date will be set once the hold is cleared'
                                : `${s.status === 'settled' ? 'Paid on' : 'Expected on'} ${fmtDate(s.payout)}`}
                        </small>
                    </div>

                    {s.status === 'hold' && (
                        <div className={styles.holdBox}>
                            <FiAlertCircle />
                            <div>
                                <strong>Why this payout is on hold</strong>
                                <p>{s.hold_reason}</p>
                            </div>
                        </div>
                    )}

                    <section className={styles.section}>
                        <h4>How this was calculated</h4>
                        <ul className={styles.breakdown}>
                            {breakdownOf(s).map((b) => (
                                <li key={b.key}>
                                    <span className={styles.bLabel}>
                                        {b.label}
                                        {b.note && <small>{b.note}</small>}
                                    </span>
                                    <span className={b.sign === '+' ? styles.plus : styles.minus}>
                                        {b.sign}{inr2.format(b.value)}
                                    </span>
                                </li>
                            ))}
                            <li className={styles.bTotal}>
                                <span className={styles.bLabel}>Net payout</span>
                                <strong>{inr2.format(s.net)}</strong>
                            </li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h4>Payout details</h4>
                        <dl className={styles.details}>
                            <div>
                                <dt>Bank account</dt>
                                <dd>{BANK.name} •••• {BANK.last4}</dd>
                            </div>
                            <div>
                                <dt>Payout date</dt>
                                <dd>{s.payout ? fmtDate(s.payout) : 'Not set'}</dd>
                            </div>
                            <div className={styles.detailsWide}>
                                <dt>UTR reference</dt>
                                <dd>
                                    {s.utr ? (
                                        <span className={styles.utrRow}>
                                            <code>{s.utr}</code>
                                            <button type="button" className={styles.miniBtn} onClick={() => onCopy(s.utr)} aria-label="Copy UTR">
                                                {copied ? <FiCheck /> : <FiCopy />}
                                            </button>
                                        </span>
                                    ) : (
                                        <span className={styles.muted}>Available after the payout is sent</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className={styles.section}>
                        <h4>
                            Orders in this settlement
                            <span className={styles.sectionHint}>
                                Showing {orders.length} of {s.orders}
                            </span>
                        </h4>
                        <ul className={styles.orderList}>
                            {orders.map((o) => (
                                <li key={o.id}>
                                    <div className={styles.orderMain}>
                                        <strong>{o.product}</strong>
                                        <span>{o.id} · {fmtOrderDate(o.date)}</span>
                                    </div>
                                    <div className={styles.orderAmt}>
                                        <strong>{inr2.format(o.amount)}</strong>
                                        <span className={o.returned ? styles.pillWarn : styles.pillOk}>
                                            {o.returned ? 'Returned' : 'Delivered'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <div className={styles.drawerFoot}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>Close</button>
                    <button type="button" className={styles.primaryBtn} onClick={() => onStatement(s)}>
                        <FiDownload /> Download statement
                    </button>
                </div>
            </aside>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
/**
 * Props (all optional, so it also works on its own with the mock data)
 *  addNotification({ h2, desc })   same shape as your pre-order page
 */
export default function Settlements({ addNotification }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [range, setRange] = useState('all');
    const [sort, setSort] = useState('newest');
    const [visible, setVisible] = useState(PAGE_SIZE);

    const [selectedId, setSelectedId] = useState(null);
    const [copied, setCopied] = useState(false);

    const notify = useCallback(
        (h2, desc) => addNotification?.({ h2, desc }),
        [addNotification],
    );

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setRows(await api.getSettlements());
        } catch (err) {
            console.error('settlements error:', err);
            setError(err?.message || 'Could not load settlements.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setVisible(PAGE_SIZE);
    }, [query, statusFilter, range, sort]);

    /* ---------- derived ---------- */
    const monthKey = `${MOCK_NOW.getFullYear()}-${String(MOCK_NOW.getMonth() + 1).padStart(2, '0')}`;

    const stats = useMemo(() => {
        const sum = (list) => round2(list.reduce((a, r) => a + r.net, 0));
        const settledMonth = rows.filter((r) => r.status === 'settled' && r.payout?.slice(0, 7) === monthKey);
        const pending = rows.filter((r) => r.status === 'processing' || r.status === 'scheduled');
        const hold = rows.filter((r) => r.status === 'hold');
        const next = [...pending].sort((a, b) => a.payout.localeCompare(b.payout))[0] || null;
        return {
            settledMonth: sum(settledMonth),
            settledMonthCount: settledMonth.length,
            pending: sum(pending),
            pendingCount: pending.length,
            hold: sum(hold),
            holdCount: hold.length,
            next,
        };
    }, [rows, monthKey]);

    const trend = useMemo(() => {
        const list = [...rows].sort((a, b) => a.end.localeCompare(b.end)).slice(-8);
        const max = Math.max(1, ...list.map((r) => r.net));
        return list.map((r) => ({ r, pct: Math.max(6, Math.round((r.net / max) * 100)) }));
    }, [rows]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const days = RANGES.find((x) => x.value === range)?.days;
        const cutoff = days ? startOfToday().getTime() - days * 86400000 : null;

        const list = rows.filter((r) => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (cutoff !== null && toDate(r.end).getTime() < cutoff) return false;
            if (q && !(r.id.toLowerCase().includes(q) || (r.utr || '').toLowerCase().includes(q))) return false;
            return true;
        });

        const sorters = {
            newest: (a, b) => b.end.localeCompare(a.end),
            oldest: (a, b) => a.end.localeCompare(b.end),
            net_desc: (a, b) => b.net - a.net,
            net_asc: (a, b) => a.net - b.net,
        };
        return list.sort(sorters[sort]);
    }, [rows, query, statusFilter, range, sort]);

    const shown = filtered.slice(0, visible);
    const filtersActive = query || statusFilter !== 'all' || range !== 'all';
    const selected = rows.find((r) => r.id === selectedId) || null;

    const clearFilters = () => {
        setQuery('');
        setStatusFilter('all');
        setRange('all');
    };

    /* ---------- actions ---------- */
    const copyUtr = async (utr) => {
        try {
            await navigator.clipboard.writeText(utr);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            notify('Error occurred', 'Could not copy. Select the text and copy it manually.');
        }
    };

    const exportList = () => {
        const head = ['Settlement ID', 'Period start', 'Period end', 'Orders', 'Gross sales', 'Returns', 'Commission', 'GST on commission', 'Shipping', 'TCS', 'TDS', 'Adjustments', 'Net payout', 'Status', 'Payout date', 'UTR'];
        const lines = filtered.map((r) =>
            [r.id, r.start, r.end, r.orders, r.gross, r.returns, r.commission, r.commission_gst, r.shipping, r.tcs, r.tds, r.adjustments, r.net, STATUS[r.status].label, r.payout || '', r.utr || ''].map(csvCell).join(','),
        );
        downloadCsv('settlements.csv', [head.map(csvCell).join(','), ...lines].join('\n'));
        notify('Success', `Exported ${filtered.length} settlement${filtered.length === 1 ? '' : 's'}.`);
    };

    const downloadStatement = (s) => {
        const lines = [
            ['Settlement', s.id],
            ['Period', `${s.start} to ${s.end}`],
            ['Status', STATUS[s.status].label],
            ['Payout date', s.payout || ''],
            ['UTR', s.utr || ''],
            [],
            ['Item', 'Amount (INR)'],
            ...breakdownOf(s).map((b) => [b.label, `${b.sign}${b.value}`]),
            ['Net payout', s.net],
        ];
        downloadCsv(`${s.id}-statement.csv`, lines.map((l) => l.map(csvCell).join(',')).join('\n'));
        notify('Success', 'Statement downloaded.');
    };

    /* ---------- render ---------- */
    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <div className={styles.topText}>
                    <h2 className={styles.pageTitle}><FiCreditCard /> Settlements</h2>
                    <p className={styles.pageSub}>
                        Track what you have earned, what is on its way to your bank, and exactly how each payout is calculated.
                    </p>
                </div>
                <div className={styles.topActions}>
                    <span className={styles.sample}>Sample data</span>
                    <button type="button" className={styles.cancelBtn} onClick={load} disabled={loading}>
                        <FiRefreshCw className={loading ? styles.spin : ''} /> Refresh
                    </button>
                    <button type="button" className={styles.primaryBtn} onClick={exportList} disabled={loading || filtered.length === 0}>
                        <FiDownload /> Export CSV
                    </button>
                </div>
            </div>

            {/* stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconGreen}`}><FiCheckCircle /></span>
                    <div>
                        <span className={styles.statLabel}>Settled this month</span>
                        <strong className={styles.statValue}>{loading ? '…' : inr0.format(stats.settledMonth)}</strong>
                        <span className={styles.statSub}>{loading ? ' ' : `${stats.settledMonthCount} settlements paid`}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconIndigo}`}><FiTrendingUp /></span>
                    <div>
                        <span className={styles.statLabel}>On the way</span>
                        <strong className={styles.statValue}>{loading ? '…' : inr0.format(stats.pending)}</strong>
                        <span className={styles.statSub}>{loading ? ' ' : `${stats.pendingCount} processing or scheduled`}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconRed}`}><FiPauseCircle /></span>
                    <div>
                        <span className={styles.statLabel}>On hold</span>
                        <strong className={styles.statValue}>{loading ? '…' : inr0.format(stats.hold)}</strong>
                        <span className={styles.statSub}>{loading ? ' ' : stats.holdCount ? `${stats.holdCount} needs your action` : 'Nothing on hold'}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconAmber}`}><FiCalendar /></span>
                    <div>
                        <span className={styles.statLabel}>Next payout</span>
                        <strong className={styles.statValue}>
                            {loading ? '…' : stats.next ? whenLabel(stats.next.payout) : '—'}
                        </strong>
                        <span className={styles.statSub}>{loading ? ' ' : stats.next ? fmtDate(stats.next.payout) : 'Nothing scheduled'}</span>
                    </div>
                </div>
            </div>

            <div className={styles.layout}>
                {/* ---------- main column ---------- */}
                <div className={styles.main}>
                    <div className={styles.toolbar}>
                        <label className={styles.search}>
                            <FiSearch aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="Search by settlement ID or UTR"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label="Search settlements"
                            />
                        </label>

                        <div className={styles.filters}>
                            <span className={styles.filterIcon}><FiFilter /></span>
                            <select className={styles.select} value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
                                {RANGES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
                                {SORTS.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            {filtersActive && (
                                <button type="button" className={styles.clearBtn} onClick={clearFilters}><FiX /> Clear</button>
                            )}
                        </div>
                    </div>

                    <div className={styles.seg} role="group" aria-label="Filter by status">
                        {STATUS_FILTERS.map((s) => {
                            const count = s.value === 'all' ? rows.length : rows.filter((r) => r.status === s.value).length;
                            return (
                                <button
                                    key={s.value}
                                    type="button"
                                    className={`${styles.segBtn} ${statusFilter === s.value ? styles.segOn : ''}`}
                                    aria-pressed={statusFilter === s.value}
                                    onClick={() => setStatusFilter(s.value)}
                                >
                                    {s.label}
                                    <span className={styles.segCount}>{loading ? '–' : count}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.listCard}>
                        <div className={styles.listHeader} aria-hidden="true">
                            <span>Settlement</span>
                            <span className={styles.right}>Orders</span>
                            <span className={styles.right}>Gross sales</span>
                            <span className={styles.right}>Deductions</span>
                            <span className={styles.right}>Net payout</span>
                            <span>Status</span>
                            <span>Payout date</span>
                            <span />
                        </div>

                        {loading ? (
                            <ul className={styles.rows} aria-busy="true">
                                {Array.from({ length: 6 }, (_, i) => (
                                    <li key={i}><div className={styles.skelRow}><i /><i /><i /><i /></div></li>
                                ))}
                            </ul>
                        ) : error ? (
                            <div className={styles.emptyState}>
                                <FiAlertCircle className={styles.emptyIcon} />
                                <p>{error}</p>
                                <button type="button" className={styles.primaryBtn} onClick={load}>Try again</button>
                            </div>
                        ) : shown.length === 0 ? (
                            <div className={styles.emptyState}>
                                <FiInbox className={styles.emptyIcon} />
                                <p>{rows.length === 0 ? 'No settlements yet.' : 'No settlements match these filters.'}</p>
                                {filtersActive && (
                                    <button type="button" className={styles.cancelBtn} onClick={clearFilters}>Clear filters</button>
                                )}
                            </div>
                        ) : (
                            <ul className={styles.rows}>
                                {shown.map((r) => {
                                    const meta = STATUS[r.status];
                                    return (
                                        <li key={r.id}>
                                            <button
                                                type="button"
                                                className={`${styles.row} ${r.id === selectedId ? styles.rowActive : ''}`}
                                                onClick={() => setSelectedId(r.id)}
                                            >
                                                <span className={styles.cId}>
                                                    <strong>{r.id}</strong>
                                                    <small>{fmtPeriod(r.start, r.end)}</small>
                                                </span>
                                                <span className={`${styles.cell} ${styles.cOrders}`} data-label="Orders">{r.orders}</span>
                                                <span className={`${styles.cell} ${styles.cGross}`} data-label="Gross sales">{inr2.format(r.gross)}</span>
                                                <span className={`${styles.cell} ${styles.cDed}`} data-label="Deductions">-{inr2.format(r.deductions)}</span>
                                                <span className={`${styles.cell} ${styles.cNet}`} data-label="Net payout">{inr2.format(r.net)}</span>
                                                <span className={styles.cStatus}>
                                                    <span className={styles[meta.cls]}>{meta.label}</span>
                                                </span>
                                                <span className={`${styles.cell} ${styles.cDate}`} data-label="Payout date">
                                                    {r.payout ? fmtDate(r.payout) : r.status === 'hold' ? 'Held' : '—'}
                                                </span>
                                                <span className={styles.cGo} aria-hidden="true"><FiChevronRight /></span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {!loading && !error && filtered.length > 0 && (
                            <div className={styles.listFoot}>
                                <span>Showing {shown.length} of {filtered.length}</span>
                                {shown.length < filtered.length && (
                                    <button type="button" className={styles.cancelBtn} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                                        Show more
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ---------- side column ---------- */}
                <aside className={styles.side}>
                    <div className={styles.nextCard}>
                        <span className={styles.nextLabel}>Next payout</span>
                        {stats.next ? (
                            <>
                                <strong className={styles.nextAmount}>{inr2.format(stats.next.net)}</strong>
                                <span className={styles.nextWhen}>
                                    <FiCalendar /> {whenLabel(stats.next.payout)} · {fmtDate(stats.next.payout)}
                                </span>
                                <button type="button" className={styles.nextBtn} onClick={() => setSelectedId(stats.next.id)}>
                                    View breakdown <FiChevronRight />
                                </button>
                            </>
                        ) : (
                            <strong className={styles.nextAmount}>{loading ? '…' : 'None yet'}</strong>
                        )}
                    </div>

                    <div className={styles.panel}>
                        <h4 className={styles.panelTitle}><FiHome /> Payout account</h4>
                        <div className={styles.bankRow}>
                            <div>
                                <strong>{BANK.name}</strong>
                                <span>{BANK.holder}</span>
                            </div>
                            {BANK.verified && <span className={styles.pillOk}>Verified</span>}
                        </div>
                        <dl className={styles.bankMeta}>
                            <div><dt>Account</dt><dd>•••• {BANK.last4}</dd></div>
                            <div><dt>IFSC</dt><dd>{BANK.ifsc}</dd></div>
                        </dl>
                    </div>

                    <div className={styles.panel}>
                        <h4 className={styles.panelTitle}><FiTrendingUp /> Net payout, last 8 weeks</h4>
                        {loading ? (
                            <div className={styles.skelChart} />
                        ) : (
                            <div className={styles.chart} role="img" aria-label="Bar chart of net payout for the last 8 weeks">
                                {trend.map(({ r, pct }) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        className={styles.barCol}
                                        onClick={() => setSelectedId(r.id)}
                                        title={`${r.id}: ${inr0.format(r.net)} (${STATUS[r.status].label})`}
                                        aria-label={`${r.id}, ${inr0.format(r.net)}, ${STATUS[r.status].label}`}
                                    >
                                        <span className={`${styles.bar} ${styles[`bar_${r.status}`]}`} style={{ height: `${pct}%` }} />
                                        <span className={styles.barLabel}>{r.id.slice(-3)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className={styles.legend}>
                            <span><i className={styles.dotOk} /> Settled</span>
                            <span><i className={styles.dotInfo} /> Processing</span>
                            <span><i className={styles.dotWarn} /> Scheduled</span>
                            <span><i className={styles.dotDanger} /> On hold</span>
                        </div>
                    </div>

                    <div className={styles.infoBox}>
                        <FiInfo />
                        <p>
                            Settlements run weekly, Monday to Sunday. Payouts reach your bank about 3 to 9 days after the
                            week closes, once return windows are clear.
                        </p>
                    </div>
                </aside>
            </div>

            {selected && (
                <Drawer
                    key={selected.id}
                    s={selected}
                    onClose={() => setSelectedId(null)}
                    onCopy={copyUtr}
                    copied={copied}
                    onStatement={downloadStatement}
                />
            )}
        </div>
    );
}