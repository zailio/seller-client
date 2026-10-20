'use client';

import { useEffect, useState } from 'react';
import {
    FiPrinter, FiSearch, FiTag, FiTrendingUp, FiXCircle,
    FiClock, FiLayers, FiDollarSign, FiShoppingBag, FiLoader
} from 'react-icons/fi';
import styles from './sales.module.css';
import Wait from '../../../components/wait';
import config from '../../../utils/config';

const RANGES = [
    { id: 'week', label: 'Last week' },
    { id: 'month', label: 'Last month' },
    { id: '90d', label: 'Last 90 days' },
    { id: '6m', label: 'Last 6 months' },
    { id: '1y', label: 'Last year' },
    { id: 'lifetime', label: 'Lifetime' }
];

const FILTERS = [
    { id: 'all', label: 'All sales', icon: FiLayers },
    { id: 'top', label: 'Top sales', icon: FiTrendingUp },
    { id: 'coupon', label: 'Coupon used', icon: FiTag },
    { id: 'cancelled', label: 'Cancelled', icon: FiXCircle },
    { id: 'recent', label: 'Recent', icon: FiClock }
];

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const compact = (n) => {
    n = Number(n || 0);
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
};

const STATUS_TAG = {
    compleated: { label: 'Delivered', cls: 'tagActive' },
    sc: { label: 'Cancelled (seller)', cls: 'tagDead' },
    uc: { label: 'Cancelled (buyer)', cls: 'tagDead' },
    pending: { label: 'Pending', cls: 'tagNeutral' },
    confirmed: { label: 'Confirmed', cls: 'tagNeutral' },
    pickup: { label: 'Pickup', cls: 'tagNeutral' },
    processing: { label: 'Processing', cls: 'tagNeutral' }
};

const SalesManage = ({
    auth,
    session,
    addNotification,
    sales,
    setSales
}) => {
    const [range, setRange] = useState('month');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

    const [summaryLoading, setSummaryLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [printLoading, setPrintLoading] = useState(false);

    const callApi = async (endpoint, payload = {}) => {
        const res = await fetch(`${config.SERVER_URL}/seller/sales/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}`
            },
            body: JSON.stringify({ session_id: session, ...payload })
        });
        const json = await res.json();
        if (!json.status || json.data?.status === false) {
            throw new Error(json.data?.message || 'Request failed');
        }
        return json.data;
    };

    const fetchSummary = async () => {
        setSummaryLoading(true);
        try {
            const data = await callApi('summary', { range });
            setSummary(data);
        } catch (err) {
            console.error('fetchSummary error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load sales summary.' });
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchList = async (targetPage = page) => {
        setListLoading(true);
        try {
            const data = await callApi('list', { range, filter, search, page: targetPage });
            setSales(Array.isArray(data.orders) ? data.orders : []);
            setPagination({ total: data.total ?? 0, total_pages: data.total_pages ?? 1 });
        } catch (err) {
            console.error('fetchList error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load sales.' });
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [range]);

    useEffect(() => {
        setPage(1);
        fetchList(1);
    }, [range, filter]);

    // Debounce search so we don't fire a request on every keystroke.
    useEffect(() => {
        setPage(1);
        const t = setTimeout(() => fetchList(1), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        fetchList(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handlePrint = async () => {
        if (printLoading) return;
        setPrintLoading(true);
        try {
            const data = await callApi('create-print', { range, filter, search });
            window.open(data.dl_url, '_blank');
        } catch (err) {
            console.error('handlePrint error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not generate the report. Please try again.' });
        } finally {
            setPrintLoading(false);
        }
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <h2 className={styles.pageTitle}><FiShoppingBag /> Sales</h2>
                <button className={styles.printBtn} onClick={handlePrint} disabled={printLoading}>
                    {printLoading ? <FiLoader className='spin' /> : <FiPrinter />}
                    {printLoading ? 'Preparing…' : 'Print'}
                </button>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}><FiDollarSign /> Revenue</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : currency(summary?.total_revenue)}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Orders</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : (summary?.total_orders ?? 0).toLocaleString('en-IN')}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Avg. order value</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : currency(summary?.avg_order_value)}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Coupon discount given</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : currency(summary?.total_discount_given)}
                    </span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardWarn}`}>
                    <span className={styles.statLabel}>Cancelled</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : (summary?.cancelled_orders ?? 0)}
                    </span>
                </div>
            </div>

            {summary?.top_product && (
                <div className={styles.topProductBanner}>
                    <img src={summary.top_product.image} alt={summary.top_product.title} className={styles.topProductThumb} />
                    <div>
                        <span className={styles.topProductLabel}>Top product this period</span>
                        <div className={styles.topProductTitle}>{summary.top_product.title}</div>
                    </div>
                    <div className={styles.topProductStats}>
                        <span>{compact(summary.top_product.units_sold)} sold</span>
                        <span>{currency(summary.top_product.revenue)}</span>
                    </div>
                </div>
            )}

            {/* Range */}
            <div className={styles.rangeRow}>
                {RANGES.map((r) => (
                    <button
                        key={r.id}
                        className={`${styles.rangeBtn} ${range === r.id ? styles.rangeBtnActive : ''}`}
                        onClick={() => setRange(r.id)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Filters + search */}
            <div className={styles.toolbar}>
                <div className={styles.filterRow}>
                    {FILTERS.map((f) => {
                        const Icon = f.icon;
                        const isActive = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                                onClick={() => setFilter(f.id)}
                            >
                                <Icon /> {f.label}
                            </button>
                        );
                    })}
                </div>
                <div className={styles.searchBox}>
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by product, tracking or order ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            {listLoading ? (
                <Wait />
            ) : sales.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiShoppingBag className={styles.emptyIcon} />
                    <p>No sales match this filter.</p>
                </div>
            ) : (
                <>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.colImage}>Item</th>
                                    <th>Product</th>
                                    <th className={styles.numCol}>Qty</th>
                                    <th className={styles.numCol}>Rate</th>
                                    <th className={styles.numCol}>Discount</th>
                                    <th className={styles.numCol}>Total</th>
                                    <th>Date</th>
                                    <th className={styles.statusCol}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((o) => {
                                    const tag = STATUS_TAG[o.status] || { label: o.visible_status || o.status, cls: 'tagNeutral' };
                                    return (
                                        <tr key={o.id}>
                                            <td className={styles.colImage}>
                                                <img src={o.image} alt={o.title} className={styles.thumb} />
                                            </td>
                                            <td>
                                                <div className={styles.productTitle}>{o.title}</div>
                                                <div className={styles.productSku}>{o.sku} · #{o.id}</div>
                                            </td>
                                            <td className={styles.numCol}>{o.quantity}</td>
                                            <td className={styles.numCol}>{currency(o.price)}</td>
                                            <td className={styles.numCol}>
                                                {currency(o.price - o.discount) + ','}
                                                {o.coupon_off ? (
                                                    <span
                                                        className={styles.couponBadge}
                                                        title={o.coupon_code || 'Coupon (deleted)'}
                                                    >
                                                        -{currency(o.coupon_off)}
                                                    </span>
                                                ) : (
                                                    'No Coupon Used'
                                                )}
                                            </td>
                                            <td className={`${styles.numCol} ${styles.totalCell}`}>{currency(o.listedPrice)}</td>
                                            <td className={styles.dateCell}>
                                                {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}
                                            </td>
                                            <td className={styles.statusCol}>
                                                <span className={styles[tag.cls]}>{tag.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {pagination.total_pages > 1 && (
                        <div className={styles.pager}>
                            <button
                                className={styles.pagerBtn}
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                Prev
                            </button>
                            <span className={styles.pagerLabel}>
                                Page {page} of {pagination.total_pages} · {pagination.total} sales
                            </span>
                            <button
                                className={styles.pagerBtn}
                                disabled={page >= pagination.total_pages}
                                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SalesManage;