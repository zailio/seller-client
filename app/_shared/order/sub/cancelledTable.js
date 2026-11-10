'use client';

import { useState } from 'react';
import styles from './css/cancelled.module.css';
import config from '../../../../utils/config';
import { FaBoxOpen, FaChevronDown, FaChevronUp, FaRegCommentDots } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';

const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

// Renders a Date/ISO string as relative time — "3 days ago", "1 month ago",
// falling back to "Just now" for anything under a minute.
const timeAgo = (input) => {
    if (!input) return '';
    const then = new Date(input).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    if (diffMs < 0) return 'Just now';

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diffMs < minute) return 'Just now';
    if (diffMs < hour) {
        const v = Math.floor(diffMs / minute);
        return `${v} minute${v === 1 ? '' : 's'} ago`;
    }
    if (diffMs < day) {
        const v = Math.floor(diffMs / hour);
        return `${v} hour${v === 1 ? '' : 's'} ago`;
    }
    if (diffMs < month) {
        const v = Math.floor(diffMs / day);
        return `${v} day${v === 1 ? '' : 's'} ago`;
    }
    if (diffMs < year) {
        const v = Math.floor(diffMs / month);
        return `${v} month${v === 1 ? '' : 's'} ago`;
    }
    const v = Math.floor(diffMs / year);
    return `${v} year${v === 1 ? '' : 's'} ago`;
};

const CancelledOrders = ({
    data,
    setReason,
    session,
    auth,
    addNotification,
    isSellerCancelled
}) => {
    const list = Array.isArray(data) ? data : [];

    // order id -> 'loading' | array of review objects | 'error'
    const [reviewState, setReviewState] = useState({});
    const [expanded, setExpanded] = useState({});

    const toggleReviews = async (orderId) => {
        const isOpen = expanded[orderId];
        setExpanded(prev => ({ ...prev, [orderId]: !isOpen }));

        // already fetched (success or in-flight) — don't refetch
        if (isOpen || reviewState[orderId]) return;

        setReviewState(prev => ({ ...prev, [orderId]: 'loading' }));
        try {
            const res = await fetch(config.SERVER_URL + '/seller/get-order-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({ session_id: session, order_id: orderId }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                setReviewState(prev => ({ ...prev, [orderId]: result.data.data || [] }));
            } else throw new Error('error');
        } catch (e) {
            console.log(e);
            setReviewState(prev => ({ ...prev, [orderId]: 'error' }));
            addNotification?.({
                h2: 'Error',
                desc: 'Could not load the review, try again later',
                tag: 'error',
            });
        }
    };

    if (!list.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No cancelled orders</p>
                <p className={styles.emptyBody}>Cancelled orders will show up here.</p>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.headCell}>Product</th>
                            <th className={styles.headCell}>Price / Payment</th>
                            <th className={styles.headCell}>Ordered</th>
                            <th className={styles.headCell}>Cancelled</th>
                            <th className={styles.headCell}>Reason</th>
                            <th className={styles.headCell}>Review status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((o) => {
                            const isOpen = !!expanded[o.id];
                            const state = reviewState[o.id];

                            return (
                                <>
                                    <tr key={o.id} className={styles.row}>
                                        <td className={styles.cell}>
                                            <div className={styles.productCell}>
                                                <img src={o.product.image} alt={o.product.title} className={styles.productImage} />
                                                <div>
                                                    <div className={styles.orderIdLabel}>#{o.id}</div>
                                                    <div className={styles.productName}>{o.product.title}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className={styles.cell}>
                                            <div className={styles.priceCell}>
                                                {o.product.price != null && (
                                                    <span className={styles.priceRow}>
                                                        <span className={styles.priceLabel}>Discount price</span>
                                                        <span className={styles.money}>{formatMoney(o.product.price)}</span>
                                                    </span>
                                                )}
                                                <span className={`${styles.pill} ${o.payment_type === 'prepaid' || o.payment_type === 'prepaid'  ? styles.pillPrepaid : styles.pillCod}`}>
                                                    {o.payment_type === 'prepaid' || o.payment_type === 'prepaid'  ? 'Prepaid' : 'COD'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className={styles.cell}>
                                            <span className={styles.timeAgoText}>{timeAgo(o.orderedAt)}</span>
                                        </td>

                                        <td className={styles.cell}>
                                            <span className={styles.timeAgoText}>{timeAgo(o.canceledAt)}</span>
                                        </td>

                                        <td className={styles.cell}>
                                            {o.reason
                                                ? (
                                                    <button
                                                        className={styles.linkBtn}
                                                        onClick={() => setReason(o.reason)}
                                                    >
                                                        {isSellerCancelled ? 'View your reason' : "View customer's reason"}
                                                    </button>
                                                )
                                                : <span className={styles.naText}>Not provided</span>}
                                        </td>

                                        <td className={styles.cell}>
                                            {o.is_reviewed ? (
                                                <button
                                                    className={styles.reviewToggleBtn}
                                                    onClick={() => toggleReviews(o.id)}
                                                >
                                                    <FaRegCommentDots />
                                                    <span>View review{isOpen ? '' : 's'}</span>
                                                    {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            ) : (
                                                <span className={styles.naText}>Not added</span>
                                            )}
                                        </td>
                                    </tr>

                                    {o.is_reviewed && isOpen && (
                                        <tr key={o.id + '-review'} className={styles.reviewRow}>
                                            <td className={styles.reviewCell} colSpan={6}>
                                                {state === 'loading' ? (
                                                    <span className={styles.reviewLoading}>
                                                        <ImSpinner2 className={styles.spin} /> Loading review…
                                                    </span>
                                                ) : state === 'error' ? (
                                                    <span className={styles.naText}>Couldn't load the review.</span>
                                                ) : Array.isArray(state) && state.length ? (
                                                    <div className={styles.reviewList}>
                                                        {state.map((r, idx) => (
                                                            <div key={r.id ?? idx} className={styles.reviewItem}>
                                                                {r.image && (
                                                                    <img src={r.image} alt={r.title || 'review image'} className={styles.reviewImage} />
                                                                )}
                                                                <div className={styles.reviewItemBody}>
                                                                    {r.title && <span className={styles.reviewItemTitle}>{r.title}</span>}
                                                                    {r.rating != null && (
                                                                        <span className={styles.reviewRating}>★ {r.rating}</span>
                                                                    )}
                                                                    {r.comment && <span className={styles.reviewComment}>{r.comment}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className={styles.naText}>No review content found.</span>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CancelledOrders;