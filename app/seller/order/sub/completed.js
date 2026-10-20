'use client';

import { useState } from 'react';
import styles from './css/completed.module.css';
import config from '../../../../utils/config';
import { FaBoxOpen, FaChevronDown, FaChevronUp, FaRegCommentDots, FaPaperPlane } from 'react-icons/fa';
import { MdArrowRight } from 'react-icons/md';
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

const CompletedOrders = ({
    data,
    setShowSomeThing,
    session,
    auth,
    addNotification
}) => {
    const list = Array.isArray(data) ? data : [];

    // order id -> 'loading' | array of review objects | 'error'
    const [reviewState, setReviewState] = useState({});
    const [expanded, setExpanded] = useState({});
    // review id -> draft reply text
    const [replyDraft, setReplyDraft] = useState({});
    // review id -> true while a reply POST is in flight
    const [replySending, setReplySending] = useState({});

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

    const sendReply = async (orderId, reviewId) => {
        const reply = (replyDraft[reviewId] || '').trim();
        if (!reply) return;

        setReplySending(prev => ({ ...prev, [reviewId]: true }));
        try {
            const res = await fetch(config.SERVER_URL + '/seller/reply-order-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({ session_id: session, order_id: orderId, review_id: reviewId, reply }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (!result.data.status) throw new Error('error');

            // reflect the reply locally so the textarea swaps for the posted reply
            setReviewState(prev => {
                const current = prev[orderId];
                if (!Array.isArray(current)) return prev;
                return {
                    ...prev,
                    [orderId]: current.map(r => (r.id === reviewId ? { ...r, seller_reply: reply } : r)),
                };
            });
            setReplyDraft(prev => {
                const next = { ...prev };
                delete next[reviewId];
                return next;
            });
        } catch (e) {
            console.log(e);
            addNotification?.({
                h2: 'Error',
                desc: 'Could not send the reply, try again later',
                tag: 'error',
            });
        } finally {
            setReplySending(prev => ({ ...prev, [reviewId]: false }));
        }
    };

    if (!list.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No completed orders yet</p>
                <p className={styles.emptyBody}>Orders show up here once they've been delivered.</p>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.headCell}>Order</th>
                            <th className={styles.headCell}>Customer</th>
                            <th className={styles.headCell}>Amount</th>
                            <th className={styles.headCell}>Payment</th>
                            <th className={styles.headCell}>Delivery charge</th>
                            <th className={styles.headCell}>Collected fee</th>
                            <th className={styles.headCell}>Ordered</th>
                            <th className={styles.headCell}>Completed</th>
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
                                            <div className={styles.stackedInfo}>
                                                <span className={styles.primaryLine}>{o.address.fullName}</span>
                                                <span className={styles.secondaryLine}>{o.address.phone}</span>
                                            </div>
                                            <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'customer', id: o.id })}>
                                                Details <MdArrowRight />
                                            </button>
                                        </td>

                                        <td className={styles.cell}>
                                            <div className={styles.stackedInfo}>
                                                <span className={styles.money}>{formatMoney(o.amount)}</span>
                                                <span className={styles.secondaryLine}>{o.items} item{o.items === 1 ? '' : 's'}</span>
                                            </div>
                                            <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'price', id: o.id })}>
                                                Details <MdArrowRight />
                                            </button>
                                        </td>

                                        <td className={styles.cell}>
                                            <span className={`${styles.pill} ${o.payment_type === 'prepaid' ? styles.pillPrepaid : styles.pillCod}`}>
                                                {o.payment_type === 'prepaid' ? 'Prepaid' : 'COD'}
                                            </span>
                                        </td>

                                        <td className={styles.cell}>
                                            {o.delivery_charge != null
                                                ? <span className={styles.money}>{formatMoney(o.delivery_charge)}</span>
                                                : <span className={styles.naText}>Not available</span>}
                                        </td>

                                        <td className={styles.cell}>
                                            {o.applied_additional_fee != null
                                                ? <span className={styles.money}>{formatMoney(o.applied_additional_fee)}</span>
                                                : <span className={styles.naText}>Not available</span>}
                                        </td>

                                        <td className={styles.cell}>
                                            <span className={styles.timeAgoText}>{timeAgo(o.orderedAt)}</span>
                                        </td>

                                        <td className={styles.cell}>
                                            <span className={styles.timeAgoText}>{timeAgo(o.completedAt)}</span>
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
                                            <td className={styles.reviewCell} colSpan={9}>
                                                {state === 'loading' ? (
                                                    <span className={styles.reviewLoading}>
                                                        <ImSpinner2 className={styles.spin} /> Loading review…
                                                    </span>
                                                ) : state === 'error' ? (
                                                    <span className={styles.naText}>Couldn't load the review.</span>
                                                ) : Array.isArray(state) && state.length ? (
                                                    <div className={styles.reviewList}>
                                                        {state.map((r, idx) => {
                                                            const reviewId = r.id ?? idx;
                                                            const sending = !!replySending[reviewId];
                                                            return (
                                                                <div key={reviewId} className={styles.reviewItem}>
                                                                    {r.image && (
                                                                        <img src={r.image} alt={r.title || 'review image'} className={styles.reviewImage} />
                                                                    )}
                                                                    <div className={styles.reviewItemBody}>
                                                                        {r.title && <span className={styles.reviewItemTitle}>{r.title}</span>}
                                                                        {r.rating != null && (
                                                                            <span className={styles.reviewRating}>★ {r.rating}</span>
                                                                        )}
                                                                        {r.comment && <span className={styles.reviewComment}>{r.comment}</span>}

                                                                        {r.seller_reply ? (
                                                                            <div className={styles.sellerReply}>
                                                                                <span className={styles.sellerReplyLabel}>Your reply</span>
                                                                                <span className={styles.sellerReplyText}>{r.seller_reply}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className={styles.replyBox}>
                                                                                <textarea
                                                                                    className={styles.replyInput}
                                                                                    placeholder="Write a reply to this review…"
                                                                                    value={replyDraft[reviewId] || ''}
                                                                                    onChange={(e) => setReplyDraft(prev => ({ ...prev, [reviewId]: e.target.value }))}
                                                                                    disabled={sending}
                                                                                    rows={2}
                                                                                />
                                                                                <button
                                                                                    className={styles.replySendBtn}
                                                                                    onClick={() => sendReply(o.id, reviewId)}
                                                                                    disabled={sending || !(replyDraft[reviewId] || '').trim()}
                                                                                >
                                                                                    {sending
                                                                                        ? <ImSpinner2 className={styles.spin} />
                                                                                        : <FaPaperPlane />}
                                                                                    {sending ? 'Sending…' : 'Reply'}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
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

export default CompletedOrders;