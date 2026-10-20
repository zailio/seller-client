'use client';

import { useEffect, useState, useRef } from 'react';
import { FiSearch, FiPackage, FiCheck, FiSlash, FiX } from 'react-icons/fi';
import styles from './coupon.module.css';
import config from '../../../utils/config';

const modeLabel = {
    none: 'Applies to all products',
    allow: 'Applies only to selected products',
    disallow: 'Applies to all products except selected'
};

// value shape: { mode: 'none' | 'allow' | 'disallow', ids: number[], products: { [id]: product } }
const ProductRestriction = ({
    auth, session,
    value, onChange,
    minimumAmount, minimumProfit,
    addNotification
}) => {
    // Re-fetch whenever the seller changes the minimum amount / profit criteria.
    const debounceRef = useRef(null);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);

    const callApi = async (endpoint, payload = {}) => {
        const res = await fetch(`${config.SERVER_URL}/seller/coupon/${endpoint}`, {
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

    const loadProducts = async (nextPage = 1) => {
        setLoading(true);
        try {
            const data = await callApi('fetch-products', {
                minimum_amount: minimumAmount === '' || minimumAmount == null ? null : Number(minimumAmount),
                minimum_profit: minimumProfit === '' || minimumProfit == null ? null : Number(minimumProfit),
                search: search.trim(),
                page: nextPage,
                limit: 10
            });
            const products = Array.isArray(data.products) ? data.products : [];
            setResults(prev => (nextPage === 1 ? products : [...prev, ...products]));
            setHasMore(Boolean(data.has_more));
            setPage(nextPage);
        } catch (err) {
            console.error('loadProducts error:', err);
            addNotification?.({ h2: 'Error occurred', desc: err.message || 'Could not load products. Please try again.' });
        } finally {
            setLoading(false);
        }
    };


    // Re-fetch whenever the seller changes the minimum amount / profit criteria,
    // but wait 300ms after typing stops instead of firing on every keystroke.
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadProducts(1);
        }, 800);
        return () => clearTimeout(debounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minimumAmount, minimumProfit]);

    const addProduct = (product, targetMode) => {
        // Locked to whichever mode already has products in it.
        if (value.mode !== 'none' && value.mode !== targetMode) return;
        if (value.ids.includes(product.id)) return;
        onChange({
            mode: targetMode,
            ids: [...value.ids, product.id],
            products: { ...value.products, [product.id]: product }
        });
    };

    const removeProduct = (id) => {
        const ids = value.ids.filter(i => i !== id);
        const products = { ...value.products };
        delete products[id];
        // Once the list is empty again, both allow and disallow unlock.
        onChange({ mode: ids.length ? value.mode : 'none', ids, products });
    };

    return (

        <div className={styles.pickerWrap}>
            <div className={`${styles.pickerCol} ${styles[`pickerCol_${value.mode}`]}`}>
                <div className={styles.pickerColTitle}>
                    <span>Your selection</span>
                    <span className={`${styles.modeBadge} ${styles[`modeBadge_${value.mode}`]}`}>
                        {modeLabel[value.mode]}
                    </span>
                </div>

                {value.ids.length === 0 ? (
                    <p className={styles.pickerEmpty}>
                        No products added. Allow or block products from the list on the right.
                    </p>
                ) : (
                    <div className={styles.addedList}>
                        {value.ids.map((id) => {
                            const p = value.products[id];
                            if (!p) return null;
                            return (
                                <div key={id} className={styles.addedChip}>
                                    {p.image
                                        ? <img className={styles.addedChipImg} src={p.image} alt={p.title} />
                                        : <FiPackage className={styles.productChipIcon} />}
                                    <span className={styles.addedChipName}>{p.title}</span>
                                    <button
                                        type="button"
                                        className={styles.addedChipRemove}
                                        title="Remove"
                                        onClick={() => removeProduct(id)}
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className={styles.pickerCol}>
                <div className={styles.pickerColTitle}><span>Find products</span></div>
                <p className={styles.criteriaNote}>
                    Matching products at ₹{minimumAmount || 0}+ amount and ₹{minimumProfit || 0}+ profit.
                </p>

                <div className={styles.searchRow}>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadProducts(1)}
                    />
                    <button type="button" className={styles.loadBtn} onClick={() => loadProducts(1)} disabled={loading}>
                        <FiSearch />
                    </button>
                </div>

                {loading && page === 1 ? (
                    <p className={styles.pickerEmpty}>Loading products…</p>
                ) : results.length === 0 ? (
                    <p className={styles.pickerEmpty}>No products match this criteria.</p>
                ) : (
                    <div className={styles.fetchList}>
                        {results.map((p) => {
                            const already = value.ids.includes(p.id);
                            const allowLocked = value.mode === 'disallow';
                            const disallowLocked = value.mode === 'allow';
                            return (
                                <div key={p.id} className={styles.fetchItem}>
                                    {p.image
                                        ? <img className={styles.fetchItemImg} src={p.image} alt={p.title} />
                                        : <FiPackage className={styles.productChipIcon} />}
                                    <div className={styles.fetchItemInfo}>
                                        <span className={styles.fetchItemTitle}>{p.title}</span>
                                        <span className={styles.fetchItemMeta}>
                                            ₹{p.price} · profit ₹{p.profit ?? '—'}
                                        </span>
                                    </div>
                                    <div className={styles.fetchItemActions}>
                                        <button
                                            type="button"
                                            className={styles.actionAllow}
                                            disabled={already || allowLocked}
                                            title={allowLocked ? 'Remove blocked products first' : 'Allow this product'}
                                            onClick={() => addProduct(p, 'allow')}
                                        >
                                            <FiCheck />
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.actionDisallow}
                                            disabled={already || disallowLocked}
                                            title={disallowLocked ? 'Remove allowed products first' : 'Block this product'}
                                            onClick={() => addProduct(p, 'disallow')}
                                        >
                                            <FiSlash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMore && !loading && (
                    <div className={styles.loadMoreRow}>
                        <button type="button" className={styles.loadMoreBtn} onClick={() => loadProducts(page + 1)}>
                            Load more
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductRestriction;