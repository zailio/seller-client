'use client';

import { useEffect, useState } from 'react';
import {
    FiPrinter, FiSearch, FiEye, FiHeart, FiBox,
    FiTrendingUp, FiAlertTriangle, FiLayers, FiClock, FiLoader
} from 'react-icons/fi';
import styles from './inventory.module.css';
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
    { id: 'all', label: 'All stock', icon: FiLayers },
    { id: 'sales', label: 'By sales', icon: FiTrendingUp },
    { id: 'deadstock', label: 'Dead stock', icon: FiAlertTriangle },
    { id: 'value', label: 'By value', icon: FiBox },
    { id: 'recent', label: 'Recently sold', icon: FiClock }
];

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const compact = (n) => {
    n = Number(n || 0);
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
};

const InventoryManage = ({
    auth,
    session,
    addNotification,
    inventory,
    setInventory
}) => {
    const [range, setRange] = useState('month');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const [summary, setSummary] = useState(null);

    const [summaryLoading, setSummaryLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [printLoading, setPrintLoading] = useState(false);

    const callApi = async (endpoint, payload = {}) => {
        const res = await fetch(`${config.SERVER_URL}/seller/inventory/${endpoint}`, {
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
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load inventory summary.' });
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchList = async () => {
        setListLoading(true);
        try {
            const data = await callApi('list', { range, filter, search });
            setInventory(Array.isArray(data.products) ? data.products : []);
        } catch (err) {
            console.error('fetchList error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load inventory.' });
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [range]);

    useEffect(() => {
        fetchList();
    }, [range, filter]);

    // Debounce search so we don't fire a request on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => fetchList(), 350);
        return () => clearTimeout(t);
    }, [search]);

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
                <h2 className={styles.pageTitle}><FiBox /> Inventory</h2>
                <button className={styles.printBtn} onClick={handlePrint} disabled={printLoading}>
                    {printLoading ? <FiLoader className='spin' /> : <FiPrinter />}
                    {printLoading ? 'Preparing…' : 'Print'}
                </button>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Products</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : (summary?.total_products ?? 0).toLocaleString('en-IN')}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total stock</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : (summary?.total_stock ?? 0).toLocaleString('en-IN')}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Stock value</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : currency(summary?.total_stock_value)}
                    </span>
                </div>
                <div className={`${styles.statCard} ${styles.statCardWarn}`}>
                    <span className={styles.statLabel}>Dead stock</span>
                    <span className={styles.statValue}>
                        {summaryLoading ? '—' : (summary?.dead_stock_count ?? 0)}
                    </span>
                </div>
            </div>

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
                        placeholder="Search by product or SKU"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            {listLoading ? (
                <Wait />
            ) : inventory.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiBox className={styles.emptyIcon} />
                    <p>No inventory match this filter.</p>
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.colImage}>Item</th>
                                <th>Product</th>
                                <th className={styles.numCol}>Count</th>
                                <th className={styles.numCol}>Rate</th>
                                <th className={styles.numCol}>Total</th>
                                <th className={styles.numCol}>Views</th>
                                <th className={styles.numCol}>Likes</th>
                                <th className={styles.statusCol}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((p) => (
                                <tr key={p.id} className={p.isDead ? styles.rowDead : ''}>
                                    <td className={styles.colImage}>
                                        <img src={p.image} alt={p.title} className={styles.thumb} />
                                    </td>
                                    <td>
                                        <div className={styles.productTitle}>{p.title}</div>
                                        <div className={styles.productSku}>{p.sku} #{p.id}</div>
                                    </td>
                                    <td className={styles.numCol}>{p.quantity}</td>
                                    <td className={styles.numCol}>{currency(p.rate)}</td>
                                    <td className={`${styles.numCol} ${styles.totalCell}`}>{currency(p.total)}</td>
                                    <td className={styles.numCol}>
                                        <span className={styles.iconInline}><FiEye /> {compact(p.views)}</span>
                                    </td>
                                    <td className={styles.numCol}>
                                        <span className={styles.iconInline}><FiHeart /> {compact(p.likes)}</span>
                                    </td>
                                    <td className={styles.statusCol}>
                                        {p.isDead ? (
                                            <span className={styles.tagDead}>Dead stock</span>
                                        ) : p.sold > 0 ? (
                                            <span className={styles.tagActive}>Selling</span>
                                        ) : (
                                            <span className={styles.tagNeutral}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
};

export default InventoryManage;