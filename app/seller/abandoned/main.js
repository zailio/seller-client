'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    FiShoppingCart, FiMail, FiMapPin, FiCalendar, FiClock, FiUser,
    FiCheck, FiSend, FiInbox, FiFilter, FiX, FiTrendingUp, FiCheckSquare
} from 'react-icons/fi';
import styles from './page.module.css';
import Wait from '../../../components/wait';

import config from '../../../utils/config';
import { formatReadableDate12, timeAgo } from '../../../utils/fn';

const PRICE_RANGES = [
    { value: 'all', label: 'All prices', test: () => true },
    { value: 'low', label: 'Under ₹1,000', test: (v) => v < 1000 },
    { value: 'mid', label: '₹1,000 - ₹5,000', test: (v) => v >= 1000 && v <= 5000 },
    { value: 'high', label: 'Above ₹5,000', test: (v) => v > 5000 },
];

const inr = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
});


const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);


const ageTone = (d) => {
    const diff = daysSince(d);
    if (diff >= 7) return 'old';
    if (diff >= 3) return 'mid';
    return 'new';
};

const AbandonedCart = ({
    auth,
    session,
    addNotification,
    carts,
    setCarts
}) => {

    const [isLoading, setIsLoading] = useState(true);

    const [selected, setSelected] = useState(new Set());
    const [priceFilter, setPriceFilter] = useState('all');
    const [stateFilter, setStateFilter] = useState('all');

    const [sendingIds, setSendingIds] = useState(new Set());

    const callApi = async (endpoint, payload = {}, method = 'POST') => {
        const isGet = method === 'GET' || method === 'HEAD';
        const data = { session_id: session, ...payload };

        // GET/HEAD can't carry a body, so the data goes in the query string instead.
        const url = isGet
            ? `${config.SERVER_URL}/seller/abandoned-cart/${endpoint}?${new URLSearchParams(data)}`
            : `${config.SERVER_URL}/seller/abandoned-cart/${endpoint}`;

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth}`
            },
            ...(isGet ? {} : { body: JSON.stringify(data) })
        });

        const json = await res.json();
        if (!json.status || json.data?.status === false) {
            throw new Error(json.data?.message || 'Request failed');
        }
        return json.data;
    };

    const fetchCarts = async () => {
        setIsLoading(true);
        try {
            const data = await callApi('', {}, 'GET');
            setCarts(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            console.error('fetchCarts error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load abandoned carts. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (carts.length === 0) {
            fetchCarts();
        }
    }, [carts.length]);

    const states = useMemo(() => [...new Set(carts.map((c) => c.state))].sort(), [carts]);

    const visible = useMemo(() => {
        const range = PRICE_RANGES.find((r) => r.value === priceFilter);
        return carts.filter(
            (c) => (stateFilter === 'all' || c.state === stateFilter) && range.test(c.value)
        );
    }, [carts, priceFilter, stateFilter]);

    const selectedVisible = visible.filter((c) => selected.has(c.id));
    const allSelected = visible.length > 0 && selectedVisible.length === visible.length;
    const totalValue = carts.reduce((sum, c) => sum + c.value, 0);
    const selectedValue = selectedVisible.reduce((sum, c) => sum + c.value, 0);
    const filtersActive = priceFilter !== 'all' || stateFilter !== 'all';

    const toggleAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) visible.forEach((c) => next.delete(c.id));
            else visible.forEach((c) => next.add(c.id));
            return next;
        });
    };

    const toggleOne = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const clearFilters = () => {
        setPriceFilter('all');
        setStateFilter('all');
    };

    // The reminder mail is sent only once. After it succeeds the cart is removed from the list.
    const sendMail = async (ids) => {
        if (!ids.length) return;
        if (ids.length > 1 && !confirm(`Send reminder mail to ${ids.length} customers? Each cart is removed after sending.`)) return;

        setSendingIds((prev) => new Set([...prev, ...ids]));
        try {
            await callApi('send-mail', { cart_ids: ids });
            setCarts((prev) => prev.filter((c) => !ids.includes(c.id)));
            setSelected((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            });
            addNotification({
                h2: 'Success',
                desc: `Reminder mail sent to ${ids.length} customer${ids.length > 1 ? 's' : ''}.`
            });
        } catch (err) {
            console.error('sendMail error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not send mail. Please try again.' });
        } finally {
            setSendingIds((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            });
        }
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <h2 className={styles.pageTitle}><FiShoppingCart /> Abandoned Carts</h2>
                <p className={styles.pageSub}>Send one reminder per cart. Once sent, the cart leaves this list.</p>
            </div>

            {isLoading ? (
                <Wait />
            ) : (
                <>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconIndigo}`}><FiShoppingCart /></span>
                            <div>
                                <span className={styles.statLabel}>Pending carts</span>
                                <strong className={styles.statValue}>{carts.length}</strong>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconGreen}`}><FiTrendingUp /></span>
                            <div>
                                <span className={styles.statLabel}>Recoverable value</span>
                                <strong className={styles.statValue}>{inr.format(totalValue)}</strong>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconAmber}`}><FiCheckSquare /></span>
                            <div>
                                <span className={styles.statLabel}>Selected</span>
                                <strong className={styles.statValue}>{selectedVisible.length}</strong>
                            </div>
                        </div>
                    </div>

                    <div className={styles.toolbar}>
                        <button
                            className={`${styles.selectAll} ${allSelected ? styles.selectAllOn : ''}`}
                            onClick={toggleAll}
                            disabled={visible.length === 0}
                        >
                            <span className={styles.box}>{allSelected && <FiCheck />}</span>
                            Select all
                            <span className={styles.countPill}>{visible.length}</span>
                        </button>

                        <div className={styles.filters}>
                            <span className={styles.filterIcon}><FiFilter /></span>
                            <select
                                className={styles.select}
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value)}
                            >
                                {PRICE_RANGES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <select
                                className={styles.select}
                                value={stateFilter}
                                onChange={(e) => setStateFilter(e.target.value)}
                            >
                                <option value="all">All states</option>
                                {states.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            {filtersActive && (
                                <button className={styles.clearBtn} onClick={clearFilters}>
                                    <FiX /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiInbox className={styles.emptyIcon} />
                            <p>
                                {carts.length === 0
                                    ? 'No abandoned carts. Everything has been followed up.'
                                    : 'No carts match these filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {visible.map((cart) => {
                                const isSelected = selected.has(cart.id);
                                const isSending = sendingIds.has(cart.id);
                                return (
                                    <div
                                        key={cart.id}
                                        className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isSending ? styles.cardSending : ''}`}
                                    >
                                        <div className={styles.imageWrap}>
                                            <img src={cart.image} alt={cart.title} loading="lazy" />
                                            <button
                                                className={`${styles.check} ${isSelected ? styles.checkOn : ''}`}
                                                onClick={() => toggleOne(cart.id)}
                                                aria-label={`Select ${cart.title}`}
                                            >
                                                {isSelected && <FiCheck />}
                                            </button>
                                            <span className={`${styles.agePill} ${styles[`age_${ageTone(cart.abandonedAt)}`]}`}>
                                                <FiClock /> {timeAgo(cart.abandonedAt)}
                                            </span>
                                        </div>

                                        <div className={styles.body}>
                                            <h3 className={styles.productTitle}>{cart.title}</h3>

                                            <div className={styles.customerRow}>
                                                <span className={styles.avatar}><FiUser /></span>
                                                <div>
                                                    <span className={styles.customerName}>{cart.customer}</span>
                                                    <span className={styles.location}>
                                                        <FiMapPin /> Ordered from: {cart.city}, {cart.district}, {cart.state}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.metaRow}>
                                                <div>
                                                    <span className={styles.metaLabel}>Order value</span>
                                                    <strong className={styles.price}>{inr.format(cart.value)}</strong>
                                                </div>
                                                <div className={styles.metaRight}>
                                                    <span className={styles.metaLabel}>Abandoned</span>
                                                    <span className={styles.dateChip}>
                                                        <FiCalendar /> {formatReadableDate12(cart.abandonedAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                className={styles.mailBtn}
                                                disabled={isSending}
                                                onClick={() => sendMail([cart.id])}
                                            >
                                                <FiMail /> {isSending ? 'Sending…' : 'Send mail'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {selectedVisible.length > 0 && (
                        <div className={styles.actionBar}>
                            <div className={styles.actionInfo}>
                                <strong>{selectedVisible.length} selected</strong>
                                <span>{inr.format(selectedValue)} recoverable</span>
                            </div>
                            <div className={styles.actionBtns}>
                                <button className={styles.cancelBtn} onClick={() => setSelected(new Set())}>
                                    Clear
                                </button>
                                <button
                                    className={styles.sendAllBtn}
                                    disabled={selectedVisible.some((c) => sendingIds.has(c.id))}
                                    onClick={() => sendMail(selectedVisible.map((c) => c.id))}
                                >
                                    <FiSend /> Send to {selectedVisible.length}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AbandonedCart;