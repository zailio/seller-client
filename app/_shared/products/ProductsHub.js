'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiPackage, FiEdit2, FiCopy, FiPower, FiMessageSquare, FiStar, FiHelpCircle, FiBox } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { bizPost } from '../../../utils/bizApi';
import { rupees, shortDate } from '../ui/format';
import { Badge, Drawer, Empty, Pager, SkeletonRows, Thumb, cx, useDebouncedEffect } from '../ui/parts';
import FeedbackPanel from './FeedbackPanel';

const STOCK = {
    in: { label: 'In stock', color: '#16a34a' },
    low: { label: 'Low stock', color: '#d97706' },
    out: { label: 'Out of stock', color: '#dc2626' },
};

const SORTS = [
    { id: 'newest', label: 'Newest first' },
    { id: 'oldest', label: 'Oldest first' },
    { id: 'price_desc', label: 'Price: high to low' },
    { id: 'price_asc', label: 'Price: low to high' },
    { id: 'stock_asc', label: 'Stock: low to high' },
    { id: 'stock_desc', label: 'Stock: high to low' },
    { id: 'title', label: 'Name A–Z' },
];

// Tabs: products first, then the three feedback types — each its own list.
const TABS = [
    { id: 'products', label: 'Products', icon: FiPackage },
    { id: 'comments', label: 'Comments', icon: FiMessageSquare },
    { id: 'reviews', label: 'Reviews', icon: FiStar },
    { id: 'questions', label: 'Questions', icon: FiHelpCircle },
];

export default function ProductsHub({ auth, session, addNotification, role, initialTab = 'products', onEditProduct, brandFilterOptions }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [tab, setTab] = useState(initialTab);
    const [unanswered, setUnanswered] = useState(null);

    useEffect(() => { setTab(initialTab); }, [initialTab]);

    const refreshSummary = useCallback(() => {
        bizPost('feedback/summary', creds).then((d) => setUnanswered(d.summary)).catch(() => { });
    }, [creds]);
    useEffect(() => { refreshSummary(); }, [refreshSummary]);

    const title = role === 'brand' ? 'Brand products' : role === 'brand_distributor' ? 'Distributed products' : 'Products';

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>{title}</h1>
                    <p className={ui.subtitle}>Manage listings, stock and customer feedback in one place.</p>
                </div>
            </div>

            <div className={ui.tabs} role="tablist">
                {TABS.map((t) => {
                    const count = t.id !== 'products' && unanswered ? unanswered[t.id]?.unanswered : 0;
                    return (
                        <button key={t.id} role="tab" aria-selected={tab === t.id} className={cx(ui.tab, tab === t.id && ui.tabActive)} onClick={() => setTab(t.id)}>
                            <t.icon size={15} /> {t.label}
                            {count > 0 && <span className={ui.tabCount} title={`${count} waiting for a reply`}>{count}</span>}
                        </button>
                    );
                })}
            </div>

            {tab === 'products'
                ? <ProductTable creds={creds} addNotification={addNotification} role={role} onEditProduct={onEditProduct} brandFilterOptions={brandFilterOptions} />
                : <FeedbackPanel key={tab} type={tab} creds={creds} addNotification={addNotification} onReplied={refreshSummary} />}
        </div>
    );
}

function ProductTable({ creds, addNotification, role, onEditProduct, brandFilterOptions }) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [stock, setStock] = useState('all');
    const [category, setCategory] = useState('');
    const [brandId, setBrandId] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ products: [], total: 0, total_pages: 1, counts: {}, categories: [] });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const [openProduct, setOpenProduct] = useState(null);

    const query = { search, status: status === 'all' ? undefined : status, stock: stock === 'all' ? undefined : stock, category: category || undefined, brand_id: brandId || undefined, sort };
    const queryKey = JSON.stringify(query);

    const load = useCallback(async (p) => {
        setLoading(true);
        try {
            const res = await bizPost('products/list', creds, { ...JSON.parse(queryKey), page: p, page_size: 20 });
            setData(res);
            setSelected(new Set());
        } catch (err) {
            addNotification({ h2: 'Products', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds, queryKey]);

    useDebouncedEffect(() => {
        setPage(1);
        load(1);
    }, [queryKey], 300);

    const goToPage = (p) => { setPage(p); load(p); };

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const allOnPage = data.products.length > 0 && data.products.every((p) => selected.has(p.id));
    const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(data.products.map((p) => p.id)));

    const bulk = async (nextStatus) => {
        setBusy(true);
        try {
            const res = await bizPost('products/bulk-status', creds, { ids: [...selected], status: nextStatus });
            addNotification({ h2: 'Products updated', desc: `${res.updated} product${res.updated === 1 ? '' : 's'} set to ${nextStatus}.`, tag: 'done' });
            load(page);
        } catch (err) {
            addNotification({ h2: 'Update failed', desc: err.message, tag: 'error' });
        } finally {
            setBusy(false);
        }
    };

    const setOneStatus = async (product, nextStatus) => {
        try {
            await bizPost('products/bulk-status', creds, { ids: [product.id], status: nextStatus });
            setData((d) => ({ ...d, products: d.products.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)) }));
            setOpenProduct((p) => (p && p.id === product.id ? { ...p, status: nextStatus } : p));
        } catch (err) {
            addNotification({ h2: 'Update failed', desc: err.message, tag: 'error' });
        }
    };

    const saveStock = async (product, quantity) => {
        try {
            const res = await bizPost('products/update-stock', creds, { product_id: product.id, quantity });
            const patch = { quantity: res.quantity, stock_state: res.stock_state };
            setData((d) => ({ ...d, products: d.products.map((p) => (p.id === product.id ? { ...p, ...patch } : p)) }));
            setOpenProduct((p) => (p && p.id === product.id ? { ...p, ...patch } : p));
            addNotification({ h2: 'Stock updated', desc: `${product.title}: ${res.quantity} in stock.`, tag: 'done' });
        } catch (err) {
            addNotification({ h2: 'Stock', desc: err.message, tag: 'error' });
        }
    };

    const counts = data.counts || {};
    const showBrand = role !== 'seller';

    return (
        <>
            <div className={ui.cards}>
                <div className={ui.card}><span className={ui.cardLabel}>All products</span><span className={ui.cardValue}>{counts.all ?? '—'}</span></div>
                <div className={ui.card}><span className={ui.cardLabel}>Active</span><span className={ui.cardValue}>{counts.active ?? '—'}</span></div>
                <div className={ui.card}><span className={ui.cardLabel}>Inactive</span><span className={ui.cardValue}>{counts.inactive ?? '—'}</span></div>
                <button type="button" className={cx(ui.card, counts.low_stock ? ui.cardAccent : undefined)} style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }} onClick={() => setStock('low')}>
                    <span className={ui.cardLabel}>Low or out of stock</span>
                    <span className={cx(ui.cardValue, counts.low_stock ? ui.negative : undefined)}>{counts.low_stock ?? '—'}</span>
                    <span className={ui.cardHint}>Click to filter</span>
                </button>
            </div>

            <div className={ui.panel}>
                {selected.size > 0 ? (
                    <div className={ui.bulkBar}>
                        <strong>{selected.size} selected</strong>
                        <button className={ui.btn} disabled={busy} onClick={() => bulk('active')}>Set active</button>
                        <button className={ui.btn} disabled={busy} onClick={() => bulk('inactive')}>Set inactive</button>
                        <button className={ui.btn} onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto' }}>Clear selection</button>
                    </div>
                ) : (
                    <div className={ui.toolbar}>
                        <div className={ui.search}>
                            <FiSearch size={15} />
                            <input className={ui.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, SKU or product ID" aria-label="Search products" />
                        </div>
                        <select className={ui.select} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select className={ui.select} value={stock} onChange={(e) => setStock(e.target.value)} aria-label="Stock">
                            <option value="all">Any stock</option>
                            <option value="in">In stock</option>
                            <option value="low">Low stock</option>
                            <option value="out">Out of stock</option>
                        </select>
                        <select className={ui.select} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                            <option value="">All categories</option>
                            {(data.categories || []).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {brandFilterOptions && brandFilterOptions.length > 1 && (
                            <select className={ui.select} value={brandId} onChange={(e) => setBrandId(e.target.value)} aria-label="Brand">
                                <option value="">All brands</option>
                                {brandFilterOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        )}
                        <select className={ui.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                )}

                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}><input type="checkbox" className={ui.checkbox} checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" /></th>
                                <th>Product</th>
                                {showBrand && <th>Brand</th>}
                                <th>Category</th>
                                <th className={ui.num}>Price</th>
                                <th className={ui.num}>Margin</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th className={ui.num}>Feedback</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !data.products.length ? <SkeletonRows rows={8} cols={showBrand ? 10 : 9} /> : data.products.map((p) => {
                                const st = STOCK[p.stock_state] || STOCK.in;
                                return (
                                    <tr key={p.id} className={cx(ui.rowClickable, selected.has(p.id) && ui.rowSelected)} onClick={() => setOpenProduct(p)}>
                                        <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className={ui.checkbox} checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} /></td>
                                        <td>
                                            <div className={ui.productCell}>
                                                <Thumb src={p.image} />
                                                <div style={{ minWidth: 0 }}>
                                                    <span className={ui.cellTitle} title={p.title}>{p.title}</span>
                                                    <span className={cx(ui.cellSub, ui.mono)}>{p.sku}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {showBrand && <td>{p.brand ? p.brand.name : <span className={ui.mutedText}>Generic</span>}</td>}
                                        <td><span className={ui.cellTitle} style={{ maxWidth: 160 }}>{p.sub_category}</span><span className={ui.cellSub}>{p.category}</span></td>
                                        <td className={ui.num}>
                                            <span style={{ fontWeight: 600 }}>{rupees(p.selling_price)}</span>
                                            {p.mrp > p.selling_price && <span className={ui.cellSub}><s>{rupees(p.mrp)}</s></span>}
                                        </td>
                                        <td className={cx(ui.num, p.margin >= 0 ? undefined : ui.negative)}>{rupees(p.margin)}</td>
                                        <td><span className={ui.stockBar}><span className={ui.stockDot} style={{ background: st.color }} />{p.quantity}<span className={ui.cellSub} style={{ display: 'inline' }}>&nbsp;{p.stock_state !== 'in' ? st.label.toLowerCase() : ''}</span></span></td>
                                        <td><Badge tone={p.status === 'active' ? 'success' : 'neutral'}>{p.status === 'active' ? 'Active' : 'Inactive'}</Badge></td>
                                        <td className={ui.num}><span title="Reviews · comments · questions">{p.reviews} · {p.comments} · {p.questions}</span></td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                {onEditProduct && <button className={ui.iconBtn} title="Edit product" aria-label="Edit product" onClick={() => onEditProduct(p.sku)}><FiEdit2 size={15} /></button>}
                                                <button className={ui.iconBtn} title={p.status === 'active' ? 'Set inactive' : 'Set active'} aria-label="Toggle status" onClick={() => setOneStatus(p, p.status === 'active' ? 'inactive' : 'active')}><FiPower size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!loading && !data.products.length && (
                        <Empty icon={FiBox} title={search || status !== 'all' || stock !== 'all' || category ? 'No products match' : 'No products yet'}>
                            {search || status !== 'all' || stock !== 'all' || category ? 'Try a different search or clear the filters.' : 'Products you upload will appear here.'}
                        </Empty>
                    )}
                </div>
                <Pager page={page} totalPages={data.total_pages} total={data.total} label="products" onPage={goToPage} disabled={loading} />
            </div>

            <ProductDrawer
                product={openProduct}
                onClose={() => setOpenProduct(null)}
                onEdit={onEditProduct}
                onStatus={setOneStatus}
                onStock={saveStock}
                addNotification={addNotification}
            />
        </>
    );
}

function ProductDrawer({ product, onClose, onEdit, onStatus, onStock, addNotification }) {
    const [stockInput, setStockInput] = useState('');
    useEffect(() => { setStockInput(product ? String(product.quantity) : ''); }, [product?.id, product?.quantity]);
    if (!product) return null;
    const st = STOCK[product.stock_state] || STOCK.in;
    const copySku = () => {
        navigator.clipboard?.writeText(product.sku).then(() => addNotification({ h2: 'Copied', desc: `SKU ${product.sku} copied.`, tag: 'done' })).catch(() => { });
    };
    const stockChanged = stockInput !== '' && Number(stockInput) !== product.quantity;

    return (
        <Drawer
            open
            onClose={onClose}
            title={product.title}
            subtitle={`Product #${product.id} · added ${shortDate(product.created_at)}`}
            actions={<Badge tone={product.status === 'active' ? 'success' : 'neutral'}>{product.status === 'active' ? 'Active' : 'Inactive'}</Badge>}
        >
            <section className={ui.section} style={{ display: 'flex', gap: 14 }}>
                {product.image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={product.image} alt="" style={{ width: 96, height: 96, borderRadius: 10, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    : <span className={ui.thumb} style={{ width: 96, height: 96 }} />}
                <dl className={ui.kv} style={{ flex: 1, gridTemplateColumns: '90px 1fr' }}>
                    <dt>SKU</dt><dd><span className={ui.mono}>{product.sku}</span> <button className={ui.btnLink} onClick={copySku} aria-label="Copy SKU"><FiCopy size={12} /></button></dd>
                    <dt>Category</dt><dd>{product.sub_category}<span className={ui.cellSub}>{product.category}</span></dd>
                    <dt>Brand</dt><dd>{product.brand ? product.brand.name : 'Generic'}</dd>
                    <dt>Event offers</dt><dd>{product.event_offers ? 'On' : 'Off'}<span className={ui.cellSub}>Change in Edit full details</span></dd>
                </dl>
            </section>

            <section className={ui.section}>
                <h4 className={ui.sectionTitle}>Pricing</h4>
                <table className={ui.breakdown}>
                    <tbody>
                        <tr><td>MRP</td><td>{rupees(product.mrp)}</td></tr>
                        <tr><td>Selling price</td><td style={{ fontWeight: 600 }}>{rupees(product.selling_price)}</td></tr>
                        <tr><td>Your cost</td><td>{rupees(product.cost)}</td></tr>
                        <tr className={ui.breakdownTotal}><td>Margin per unit<span className={ui.breakdownNote}>Before shipping, fees and discounts</span></td><td className={product.margin >= 0 ? ui.positive : ui.negative}>{rupees(product.margin)}</td></tr>
                    </tbody>
                </table>
            </section>

            <section className={ui.section}>
                <h4 className={ui.sectionTitle}>Stock</h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={ui.stockBar}><span className={ui.stockDot} style={{ background: st.color }} /> {st.label}</span>
                    <input className={ui.input} style={{ width: 110 }} inputMode="numeric" value={stockInput} onChange={(e) => setStockInput(e.target.value.replace(/\D/g, ''))} aria-label="Stock quantity" />
                    <button className={cx(ui.btn, ui.btnPrimary)} disabled={!stockChanged} onClick={() => onStock(product, Number(stockInput))}>Save stock</button>
                </div>
            </section>

            <section className={ui.section}>
                <h4 className={ui.sectionTitle}>Performance</h4>
                <dl className={ui.kv}>
                    <dt>Rating</dt><dd>{product.rating ? `${Number(product.rating).toFixed(1)} ★ (${product.reviews} reviews)` : 'No ratings yet'}</dd>
                    <dt>Sold</dt><dd>{product.buys}</dd>
                    <dt>Views</dt><dd>{product.views}</dd>
                    <dt>Comments</dt><dd>{product.comments}</dd>
                    <dt>Questions</dt><dd>{product.questions}</dd>
                </dl>
            </section>

            <section className={ui.section} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {onEdit && <button className={cx(ui.btn, ui.btnPrimary)} onClick={() => onEdit(product.sku)}><FiEdit2 size={14} /> Edit full details</button>}
                <button className={cx(ui.btn, product.status === 'active' && ui.btnDanger)} onClick={() => onStatus(product, product.status === 'active' ? 'inactive' : 'active')}>
                    <FiPower size={14} /> {product.status === 'active' ? 'Set inactive' : 'Set active'}
                </button>
            </section>
        </Drawer>
    );
}
