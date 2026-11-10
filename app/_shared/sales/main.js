'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FiDownload, FiSearch, FiSliders, FiX, FiChevronUp, FiChevronDown, FiShoppingBag, FiTruck, FiMapPin, FiInfo,
} from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import styles from './salesV2.module.css';
import { bizPost, downloadText } from '../../../utils/bizApi';
import { rupees, compactRupees, shortDate, dateTime, PROFIT_STATUS, orderStatus } from '../ui/format';
import { Badge, Drawer, Empty, Pager, SkeletonRows, Thumb, cx, useDebouncedEffect } from '../ui/parts';

const RANGES = [
    { id: '7d', label: '7 days', days: 7 },
    { id: '30d', label: '30 days', days: 30 },
    { id: '90d', label: '90 days', days: 90 },
    { id: '1y', label: '1 year', days: 365 },
    { id: 'all', label: 'All time' },
    { id: 'custom', label: 'Custom' },
];

const EMPTY_FILTERS = {
    search: '', customer: '', district: '', state: '', pincode: '',
    status: 'all', payment_type: 'all', return_eligible: 'all', replacement_eligible: 'all',
    profit_min: '', profit_max: '', from: '', to: '',
};

const ADVANCED_KEYS = ['customer', 'district', 'state', 'pincode', 'status', 'payment_type', 'return_eligible', 'replacement_eligible', 'profit_min', 'profit_max'];

const isoDay = (d) => d.toISOString().slice(0, 10);
function rangeDates(rangeId, filters) {
    if (rangeId === 'custom') return { from: filters.from || undefined, to: filters.to || undefined };
    const r = RANGES.find((x) => x.id === rangeId);
    if (!r || !r.days) return {};
    const from = new Date();
    from.setDate(from.getDate() - (r.days - 1));
    return { from: isoDay(from) };
}

// The search box matches an order id ("#ORD-12", "12") or a product name / SKU.
function toServerFilters(rangeId, f) {
    const term = f.search.trim();
    const looksLikeOrder = /^#?(ord-?)?\d+$/i.test(term);
    const out = { ...rangeDates(rangeId, f) };
    if (term) out[looksLikeOrder ? 'order_id' : 'product'] = term;
    for (const key of ADVANCED_KEYS) {
        if (f[key] !== '' && f[key] !== 'all') out[key] = f[key];
    }
    return out;
}

const money = (v, opts) => (v === null || v === undefined ? <span className={ui.mutedText}>—</span> : rupees(v, opts));

function ProfitCell({ breakdown }) {
    if (breakdown.profit === null) return <span className={ui.mutedText} title="Cost was not recorded for this order">Not recorded</span>;
    const st = PROFIT_STATUS[breakdown.profit_status] || PROFIT_STATUS.estimated;
    return (
        <span className={styles.profitCell}>
            <span className={breakdown.profit >= 0 ? ui.positive : ui.negative}>{rupees(breakdown.profit)}</span>
            {breakdown.profit_status !== 'final' && <span className={styles.profitTag} data-tone={st.tone}>{st.label}</span>}
        </span>
    );
}

function PolicyCell({ value }) {
    if (value === 'Not recorded') return <span className={ui.mutedText}>—</span>;
    return <span className={value === 'No' ? ui.mutedText : undefined}>{value}</span>;
}

// Column definitions: every financial column the business asked for, in that order.
const FULL_COLUMNS = [
    { key: 'cost', label: 'Product cost', num: true, render: (o) => money(o.breakdown.product_cost) },
    { key: 'collected', label: 'Collected fee', num: true, render: (o) => money(o.breakdown.collected_fee, { decimals: 0 }) },
    { key: 'shipping', label: 'Shipping', num: true, render: (o) => money(o.breakdown.shipping_charge) },
    { key: 'rto', label: 'RTO charge', num: true, render: (o) => money(o.breakdown.rto_charge) },
    { key: 'return', label: 'Return', render: (o) => <PolicyCell value={o.return_period} /> },
    { key: 'replacement', label: 'Replacement', render: (o) => <PolicyCell value={o.replacement_period} /> },
    { key: 'affiliate', label: 'Affiliate', num: true, render: (o) => money(o.breakdown.affiliate_commission) },
    { key: 'marketplace', label: 'Marketplace fee', num: true, render: (o) => money(o.breakdown.marketplace_fee) },
    { key: 'event', label: 'Event offer', num: true, render: (o) => money(o.breakdown.event_offer_fee) },
    { key: 'coupon', label: 'Coupon', num: true, render: (o) => money(o.breakdown.coupon_discount) },
];

const SalesManage = ({ auth, session, addNotification, setSales }) => {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [rangeId, setRangeId] = useState('30d');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState('full'); // full | compact
    const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
    const [page, setPage] = useState(1);

    const [data, setData] = useState({ orders: [], total: 0, total_pages: 1 });
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const [openId, setOpenId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const serverFilters = useMemo(() => toServerFilters(rangeId, filters), [rangeId, filters]);
    const filterKey = JSON.stringify(serverFilters);
    const activeAdvanced = ADVANCED_KEYS.filter((k) => filters[k] !== '' && filters[k] !== 'all').length;

    const load = useCallback(async (targetPage) => {
        setLoading(true);
        try {
            const [list, sum] = await Promise.all([
                bizPost('sales/orders', creds, { filters: serverFilters, sort, page: targetPage, page_size: 25 }),
                targetPage === 1 ? bizPost('sales/totals', creds, { filters: serverFilters }) : Promise.resolve(null),
            ]);
            setData(list);
            if (setSales) setSales(list.orders);
            if (sum) setTotals(sum.totals);
        } catch (err) {
            addNotification({ h2: 'Sales', desc: err.message || 'Could not load sales.', tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds, filterKey, sort]);

    // text filters are debounced; everything else applies immediately
    useDebouncedEffect(() => {
        setPage(1);
        load(1);
    }, [filterKey, sort.field, sort.dir], 300);

    const goToPage = (p) => {
        setPage(p);
        load(p);
    };

    useEffect(() => {
        if (!openId) {
            setDetail(null);
            return;
        }
        let cancelled = false;
        setDetailLoading(true);
        bizPost('sales/order', creds, { order_id: openId })
            .then((d) => { if (!cancelled) setDetail(d.order); })
            .catch((err) => {
                if (!cancelled) addNotification({ h2: 'Order', desc: err.message, tag: 'error' });
            })
            .finally(() => { if (!cancelled) setDetailLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openId, creds]);

    const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
    const clearAdvanced = () => setFilters((f) => {
        const next = { ...f };
        ADVANCED_KEYS.forEach((k) => { next[k] = EMPTY_FILTERS[k]; });
        return next;
    });

    const toggleSort = (field) => setSort((s) => (s.field === field ? { field, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { field, dir: 'desc' }));
    const SortIcon = ({ field }) => (sort.field !== field ? null : sort.dir === 'desc' ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const res = await bizPost('sales/export', creds, { filters: serverFilters, sort });
            if (!res.rows) {
                addNotification({ h2: 'Export', desc: 'No orders match these filters.', tag: 'info' });
                return;
            }
            downloadText(res.csv, res.file_name);
            if (res.truncated) addNotification({ h2: 'Export', desc: 'Only the most recent 5,000 orders were exported. Narrow the date range for the rest.', tag: 'info' });
        } catch (err) {
            addNotification({ h2: 'Export failed', desc: err.message, tag: 'error' });
        } finally {
            setExporting(false);
        }
    };

    const columnCount = view === 'full' ? 5 + FULL_COLUMNS.length : 6;
    const orders = data.orders || [];

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>Sales</h1>
                    <p className={ui.subtitle}>Every order with its complete cost and profit breakdown. Click an order for details.</p>
                </div>
                <div className={ui.headerActions}>
                    <button className={ui.btn} onClick={exportCsv} disabled={exporting || loading}>
                        <FiDownload size={15} /> {exporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </div>
            </div>

            <div className={ui.cards}>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Orders</span>
                    <span className={ui.cardValue}>{totals ? (totals.orders - totals.cancelled_orders).toLocaleString('en-IN') : '—'}</span>
                    <span className={ui.cardHint}>{totals ? `${totals.cancelled_orders} cancelled · ${totals.units} units` : ' '}</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Sold</span>
                    <span className={ui.cardValue}>{totals ? compactRupees(totals.sold) : '—'}</span>
                    <span className={ui.cardHint}>Paid by customers, incl. shipping</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Product cost</span>
                    <span className={ui.cardValue}>{totals ? compactRupees(totals.product_cost) : '—'}</span>
                    <span className={ui.cardHint}>{totals ? `Shipping ${compactRupees(totals.shipping)}` : ' '}</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Discounts given</span>
                    <span className={ui.cardValue}>{totals ? compactRupees(totals.coupon + totals.event_offer) : '—'}</span>
                    <span className={ui.cardHint}>{totals ? `Coupons ${compactRupees(totals.coupon)} · Events ${compactRupees(totals.event_offer)}` : ' '}</span>
                </div>
                <div className={cx(ui.card, ui.cardAccent)}>
                    <span className={ui.cardLabel}>Profit</span>
                    <span className={cx(ui.cardValue, totals && totals.profit < 0 ? ui.negative : undefined)}>{totals ? compactRupees(totals.profit) : '—'}</span>
                    <span className={ui.cardHint}>
                        {totals ? `${compactRupees(totals.final_profit)} final · ${compactRupees(totals.estimated_profit)} estimated` : ' '}
                    </span>
                </div>
            </div>

            {totals && totals.unrecorded_orders > 0 && (
                <div className={cx(ui.notice, ui.noticeWarn)} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                    <FiInfo size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                        {totals.unrecorded_orders} order{totals.unrecorded_orders > 1 ? 's were' : ' was'} placed before cost tracking began,
                        so {totals.unrecorded_orders > 1 ? 'their' : 'its'} profit shows as “Not recorded” and is left out of the profit totals.
                    </span>
                </div>
            )}

            <div className={ui.panel}>
                <div className={ui.toolbar}>
                    <div className={ui.search}>
                        <FiSearch size={15} />
                        <input
                            className={ui.input}
                            value={filters.search}
                            onChange={(e) => setFilter('search', e.target.value)}
                            placeholder="Search order ID, product or SKU"
                            aria-label="Search sales"
                        />
                    </div>
                    <div className={ui.chips} role="group" aria-label="Date range">
                        {RANGES.map((r) => (
                            <button key={r.id} className={cx(ui.chip, rangeId === r.id && ui.chipActive)} onClick={() => setRangeId(r.id)}>{r.label}</button>
                        ))}
                    </div>
                    <button className={cx(ui.btn, showFilters && ui.btnPrimary)} onClick={() => setShowFilters((v) => !v)}>
                        <FiSliders size={15} /> Filters{activeAdvanced ? ` (${activeAdvanced})` : ''}
                    </button>
                    <div className={styles.viewToggle} role="group" aria-label="Table view">
                        <button className={cx(view === 'full' && styles.viewActive)} onClick={() => setView('full')}>Full breakdown</button>
                        <button className={cx(view === 'compact' && styles.viewActive)} onClick={() => setView('compact')}>Compact</button>
                    </div>
                </div>

                {rangeId === 'custom' && (
                    <div className={ui.filterGrid}>
                        <label className={ui.field}><span>From</span><input type="date" className={ui.input} value={filters.from} onChange={(e) => setFilter('from', e.target.value)} /></label>
                        <label className={ui.field}><span>To</span><input type="date" className={ui.input} value={filters.to} onChange={(e) => setFilter('to', e.target.value)} /></label>
                    </div>
                )}

                {showFilters && (
                    <div className={ui.filterGrid}>
                        <label className={ui.field}><span>Customer</span><input className={ui.input} value={filters.customer} onChange={(e) => setFilter('customer', e.target.value)} placeholder="Name" /></label>
                        <label className={ui.field}><span>District</span><input className={ui.input} value={filters.district} onChange={(e) => setFilter('district', e.target.value)} /></label>
                        <label className={ui.field}><span>State</span><input className={ui.input} value={filters.state} onChange={(e) => setFilter('state', e.target.value)} /></label>
                        <label className={ui.field}><span>Pincode</span><input className={ui.input} inputMode="numeric" maxLength={6} value={filters.pincode} onChange={(e) => setFilter('pincode', e.target.value.replace(/\D/g, ''))} /></label>
                        <label className={ui.field}><span>Order status</span>
                            <select className={ui.select} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
                                <option value="all">All statuses</option>
                                <option value="in_progress">In progress</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">In transit</option>
                                <option value="completed">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </label>
                        <label className={ui.field}><span>Payment</span>
                            <select className={ui.select} value={filters.payment_type} onChange={(e) => setFilter('payment_type', e.target.value)}>
                                <option value="all">All</option>
                                <option value="prepaid">Prepaid</option>
                                <option value="cod">COD</option>
                            </select>
                        </label>
                        <label className={ui.field}><span>Return</span>
                            <select className={ui.select} value={filters.return_eligible} onChange={(e) => setFilter('return_eligible', e.target.value)}>
                                <option value="all">Any</option>
                                <option value="yes">Returnable</option>
                                <option value="no">Not returnable</option>
                            </select>
                        </label>
                        <label className={ui.field}><span>Replacement</span>
                            <select className={ui.select} value={filters.replacement_eligible} onChange={(e) => setFilter('replacement_eligible', e.target.value)}>
                                <option value="all">Any</option>
                                <option value="yes">Replaceable</option>
                                <option value="no">Not replaceable</option>
                            </select>
                        </label>
                        <div className={ui.field}><span>Profit (₹)</span>
                            <div className={ui.rangeInputs}>
                                <input className={ui.input} inputMode="decimal" placeholder="Min" value={filters.profit_min} onChange={(e) => setFilter('profit_min', e.target.value.replace(/[^\d.-]/g, ''))} aria-label="Minimum profit" />
                                <input className={ui.input} inputMode="decimal" placeholder="Max" value={filters.profit_max} onChange={(e) => setFilter('profit_max', e.target.value.replace(/[^\d.-]/g, ''))} aria-label="Maximum profit" />
                            </div>
                        </div>
                        <div className={ui.field} style={{ justifyContent: 'flex-end' }}>
                            <button className={ui.btn} onClick={clearAdvanced} disabled={!activeAdvanced}><FiX size={14} /> Clear filters</button>
                        </div>
                    </div>
                )}

                <div className={ui.tableWrap}>
                    <table className={cx(ui.table, styles.salesTable)}>
                        <thead>
                            <tr>
                                <th className={cx(ui.sortable, styles.stickyCol)} onClick={() => toggleSort('date')}>Order <SortIcon field="date" /></th>
                                <th>Product</th>
                                <th>Customer</th>
                                {view === 'full' && FULL_COLUMNS.map((c) => <th key={c.key} className={c.num ? ui.num : undefined}>{c.label}</th>)}
                                <th className={cx(ui.num, ui.sortable)} onClick={() => toggleSort('sold')}>Sold price <SortIcon field="sold" /></th>
                                <th className={cx(ui.num, ui.sortable)} onClick={() => toggleSort('profit')}>Profit <SortIcon field="profit" /></th>
                                {view === 'compact' && <th>Status</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !orders.length ? <SkeletonRows rows={8} cols={columnCount} /> : orders.map((o) => {
                                const st = orderStatus(o.status, o.visible_status);
                                return (
                                    <tr key={o.id} className={cx(ui.rowClickable, openId === o.id && ui.rowSelected)} onClick={() => setOpenId(o.id)}>
                                        <td className={styles.stickyCol}>
                                            <span className={cx(ui.cellTitle, ui.mono)}>{o.order_label}</span>
                                            <span className={ui.cellSub}>{shortDate(o.created_at)}{view === 'full' && <> · <span className={styles.inlineStatus} data-tone={st.tone}>{st.label}</span></>}</span>
                                        </td>
                                        <td>
                                            <div className={ui.productCell}>
                                                <Thumb src={o.product.image} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span className={ui.cellTitle} title={o.product.title}>{o.product.title}</span>
                                                    <span className={ui.cellSub}>Qty {o.breakdown.quantity}{o.product.sku ? ` · ${o.product.sku}` : ''}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {/* Customer, district, state and pincode in one column */}
                                            <span className={ui.cellTitle} style={{ maxWidth: 200 }}>{o.customer.name || '—'}</span>
                                            <span className={ui.cellSub} style={{ maxWidth: 220 }} title={[o.customer.pincode, o.customer.district, o.customer.state].filter(Boolean).join(' · ')}>
                                                {/* pincode first so it is never cut off */}
                                                {o.customer.pincode && <><span className={ui.mono}>{o.customer.pincode}</span> · </>}
                                                {[o.customer.district, o.customer.state].filter(Boolean).join(', ') || '—'}
                                            </span>
                                        </td>
                                        {view === 'full' && FULL_COLUMNS.map((c) => <td key={c.key} className={c.num ? ui.num : undefined}>{c.render(o)}</td>)}
                                        <td className={ui.num} style={{ fontWeight: 600 }}>{rupees(o.breakdown.sold_price)}</td>
                                        <td className={ui.num}><ProfitCell breakdown={o.breakdown} /></td>
                                        {view === 'compact' && <td><Badge tone={st.tone}>{st.label}</Badge></td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!loading && !orders.length && (
                        <Empty icon={FiShoppingBag} title="No orders match">
                            Try a wider date range or clear some filters.
                        </Empty>
                    )}
                </div>
                <Pager page={page} totalPages={data.total_pages} total={data.total} label="orders" onPage={goToPage} disabled={loading} />
            </div>

            <OrderDrawer
                open={Boolean(openId)}
                loading={detailLoading}
                order={detail}
                onClose={() => setOpenId(null)}
            />
        </div>
    );
};

function OrderDrawer({ open, loading, order, onClose }) {
    const b = order?.breakdown;
    const st = order ? orderStatus(order.status, order.visible_status) : null;
    const profitState = b ? (PROFIT_STATUS[b.profit_status] || PROFIT_STATUS.estimated) : null;
    const address = order?.customer?.address;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={order ? order.order_label : 'Order'}
            subtitle={order ? `${dateTime(order.created_at)} · ${order.payment_type === 'cod' ? 'Cash on delivery' : 'Prepaid'}` : ''}
            actions={st && <Badge tone={st.tone}>{st.label}</Badge>}
        >
            {loading || !order ? (
                <div style={{ padding: '20px 0', display: 'grid', gap: 12 }}>
                    {[80, 60, 90, 70, 50].map((w, i) => <span key={i} className={ui.skeleton} style={{ width: `${w}%` }} />)}
                </div>
            ) : (
                <>
                    <section className={ui.section}>
                        <h4 className={ui.sectionTitle}>Product</h4>
                        <div className={ui.productCell} style={{ maxWidth: 'none' }}>
                            <Thumb src={order.product.image} />
                            <div style={{ minWidth: 0 }}>
                                <span className={ui.cellTitle} style={{ whiteSpace: 'normal' }}>{order.product.title}</span>
                                <span className={ui.cellSub}>
                                    ID {order.product.id}{order.product.sku ? ` · SKU ${order.product.sku}` : ''}{order.size ? ` · Size ${order.size}` : ''}
                                </span>
                            </div>
                        </div>
                        <dl className={ui.kv} style={{ marginTop: 12 }}>
                            <dt>Quantity</dt><dd>{b.quantity}</dd>
                            <dt>Sold price</dt><dd style={{ fontWeight: 600 }}>{rupees(b.sold_price)}</dd>
                        </dl>
                    </section>

                    <section className={ui.section}>
                        <h4 className={ui.sectionTitle}>Financial breakdown</h4>
                        {!b.recorded && (
                            <div className={cx(ui.notice, ui.noticeWarn)} style={{ marginBottom: 10 }}>
                                This order was placed before cost tracking began. Its product cost and fees were not recorded at the time,
                                so profit is not calculated (today’s prices are never used for past orders).
                            </div>
                        )}
                        <table className={ui.breakdown}>
                            <tbody>
                                <tr><td>Sold price<span className={ui.breakdownNote}>Paid by the customer (after discounts, incl. shipping)</span></td><td>{money(b.sold_price)}</td></tr>
                                <tr><td>Shipping charge<span className={ui.breakdownNote}>Paid by the customer; passed to the courier</span></td><td>{money(b.shipping_charge !== null ? -b.shipping_charge : null)}</td></tr>
                                <tr><td>Product cost{b.recorded && b.quantity > 1 && <span className={ui.breakdownNote}>{b.quantity} × {rupees(b.product_cost / b.quantity)}</span>}</td><td>{money(b.product_cost !== null ? -b.product_cost : null)}</td></tr>
                                <tr><td>Marketplace fee</td><td>{money(b.marketplace_fee !== null ? -b.marketplace_fee : null)}</td></tr>
                                <tr><td>Affiliate commission</td><td>{money(b.affiliate_commission !== null ? -b.affiliate_commission : null)}</td></tr>
                                <tr><td>Event offer fee{b.event_offer && <span className={ui.breakdownNote}>{b.event_offer.name} · {b.event_offer.percent}% off (already off the sold price)</span>}</td><td>{money(b.event_offer_fee)}</td></tr>
                                <tr><td>Coupon discount{order.coupon_code && <span className={ui.breakdownNote}>Code {order.coupon_code} (already off the sold price)</span>}</td><td>{money(b.coupon_discount)}</td></tr>
                                <tr><td>RTO charge<span className={ui.breakdownNote}>{b.is_rto ? 'Deducted — this order returned to origin' : 'Shipping without packing; deducted only if the order is RTO'}</span></td><td>{b.rto_charge === null ? money(null) : b.is_rto ? rupees(-b.rto_charge) : <span className={ui.mutedText}>{rupees(b.rto_charge)}</span>}</td></tr>
                                <tr><td>Collected fee<span className={ui.breakdownNote}>Gateway / COD fee — included in the shipping charge</span></td><td><span className={ui.mutedText}>{money(b.collected_fee)}</span></td></tr>
                                <tr className={ui.breakdownTotal}>
                                    <td>Profit {profitState && b.profit !== null && <Badge tone={profitState.tone}>{profitState.label}</Badge>}</td>
                                    <td className={b.profit === null ? undefined : b.profit >= 0 ? ui.positive : ui.negative}>{b.profit === null ? 'Not recorded' : rupees(b.profit)}</td>
                                </tr>
                            </tbody>
                        </table>
                        {b.recorded && (
                            <p className={ui.notice} style={{ marginTop: 10 }}>
                                Profit = sold price − shipping − product cost − marketplace fee − affiliate commission{b.is_rto ? ' − RTO charge' : ''}.
                                Coupon and event-offer discounts are already taken off the sold price, so they are not deducted twice.
                                {b.profit_status === 'estimated' && ' It stays estimated until the order is delivered and its return/replacement window has passed.'}
                                {b.source === 'backfill' && ' Cost for this order was filled in later from the product’s cost at that time, so it stays an estimate.'}
                            </p>
                        )}
                    </section>

                    <section className={ui.section}>
                        <h4 className={ui.sectionTitle}>Return & replacement</h4>
                        <dl className={ui.kv}>
                            <dt>Return</dt><dd>{order.return_period === 'Yes' ? `Yes · ${b.return_days} days` : order.return_period}</dd>
                            <dt>Replacement</dt><dd>{order.replacement_period}</dd>
                        </dl>
                        <p className={ui.breakdownNote} style={{ marginTop: 6 }}>As applicable when the customer bought this item.</p>
                    </section>

                    <section className={ui.section}>
                        <h4 className={ui.sectionTitle}><FiMapPin size={11} /> Customer</h4>
                        <dl className={ui.kv}>
                            <dt>Name</dt><dd>{order.customer.name || '—'}</dd>
                            {address?.phone && <><dt>Phone</dt><dd className={ui.mono}>{address.phone}</dd></>}
                            {(address?.line1 || address?.line2 || address?.city) && <><dt>Address</dt><dd>{[address.line1, address.line2, address.city].filter(Boolean).join(', ')}</dd></>}
                            <dt>District</dt><dd>{order.customer.district || '—'}</dd>
                            <dt>State</dt><dd>{order.customer.state || '—'}</dd>
                            <dt>Pincode</dt><dd className={ui.mono}>{order.customer.pincode || '—'}</dd>
                        </dl>
                    </section>

                    {(order.tracking_id || order.timeline?.length > 0) && (
                        <section className={ui.section}>
                            <h4 className={ui.sectionTitle}><FiTruck size={11} /> Shipment</h4>
                            {order.tracking_id && (
                                <dl className={ui.kv} style={{ marginBottom: 10 }}>
                                    <dt>Tracking</dt><dd className={ui.mono}>{order.tracking_id}</dd>
                                    {order.delivery_partner && <><dt>Partner</dt><dd>{order.delivery_partner}</dd></>}
                                </dl>
                            )}
                            <ol className={styles.timeline}>
                                {(order.timeline || []).map((step, i) => (
                                    <li key={i} data-status={step.status || 'upcoming'}>
                                        <span className={styles.timelineTitle}>{step.title}</span>
                                        {(step.subtitles?.[0] || step.subtitle) && <span className={ui.cellSub} style={{ whiteSpace: 'normal' }}>{step.subtitles?.[0] || step.subtitle}</span>}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </>
            )}
        </Drawer>
    );
}

export default SalesManage;
