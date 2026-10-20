'use client';

import { useMemo, useState } from 'react';
import styles from './css/processing.module.css';
import { MdArrowRight } from 'react-icons/md';
import { FaInfoCircle, FaBoxOpen, FaLink, FaCheckCircle, FaCircle, FaTruck } from 'react-icons/fa';

const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
const COMBO_TINT_COUNT = 5; // must match .comboTint0..4 in the CSS module

const formatWhen = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Picks the step that best represents "where the product is right now":
// prefer the step marked active; if none is active (either everything is
// still 'completed' pre-dispatch, or the whole flow finished), fall back to
// the last completed step so we never render a blank status.
const getCurrentStep = (updates) => {
    const list = updates?.list;
    if (!Array.isArray(list) || !list.length) return null;
    const active = list.find(s => s.status === 'active');
    if (active) return active;
    const completed = list.filter(s => s.status === 'completed');
    return completed.length ? completed[completed.length - 1] : list[0];
};

// A step's most recent line: multi-event steps use `subtitles` (array, last
// = latest); single-event steps use `subtitle` (string).
const getLatestLine = (step) => {
    if (!step) return '';
    if (Array.isArray(step.subtitles) && step.subtitles.length) {
        return step.subtitles[step.subtitles.length - 1];
    }
    return step.subtitle || '';
};

// Splits a delhivery-style line "Event: Location, date time" into
// { event, rest } so we can bold just the event name in the UI.
const splitLine = (line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return { event: line, rest: '' };
    return { event: line.slice(0, idx).trim(), rest: line.slice(idx + 1).trim() };
};

const ProcessingOrders = ({
    processing,
    setShowSomeThing,
    addNotification,
}) => {
    const list = Array.isArray(processing) ? processing : [];

    // ---- combo grouping (identical approach to PickupOrders) ----
    const comboGroups = useMemo(() => {
        const map = {};
        list.forEach(o => {
            if (!o.apide) return;
            if (!map[o.apide]) map[o.apide] = [];
            map[o.apide].push(o.id);
        });
        Object.keys(map).forEach(key => {
            if (map[key].length < 2) delete map[key];
        });
        return map;
    }, [list]);

    const comboColorIndex = useMemo(() => {
        const map = {};
        Object.keys(comboGroups).forEach((key, idx) => {
            map[key] = idx % COMBO_TINT_COUNT;
        });
        return map;
    }, [comboGroups]);

    const sortedList = useMemo(() => {
        const seen = new Set();
        const result = [];
        list.forEach(o => {
            if (seen.has(o.id)) return;
            result.push(o);
            seen.add(o.id);
            const groupIds = o.apide ? comboGroups[o.apide] : undefined;
            if (groupIds) {
                groupIds.forEach(id => {
                    if (id === o.id || seen.has(id)) return;
                    const match = list.find(x => x.id === id);
                    if (match) { result.push(match); seen.add(id); }
                });
            }
        });
        return result;
    }, [list, comboGroups]);

    const rowMeta = useMemo(() => {
        const seenGroupStart = new Set();
        return sortedList.map(o => {
            const groupIds = o.apide ? comboGroups[o.apide] : undefined;
            if (!groupIds) return { isGrouped: false, isGroupStart: true, groupSize: 1, colorIndex: null };
            const isStart = !seenGroupStart.has(o.apide);
            if (isStart) seenGroupStart.add(o.apide);
            return {
                isGrouped: true,
                isGroupStart: isStart,
                groupSize: groupIds.length,
                colorIndex: comboColorIndex[o.apide]
            };
        });
    }, [sortedList, comboGroups, comboColorIndex]);

    if (processing === false) return null; // OrderManagement renders <Wait/> for this case already

    if (!list.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No orders in transit</p>
                <p className={styles.emptyBody}>Orders show up here once they're dispatched and picked up by the courier.</p>
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
                            <th className={styles.headCell}>Warehouse</th>
                            <th className={styles.headCell}>Delivery charge</th>
                            <th className={styles.headCell}>
                                <span>Collected fee</span>
                                <button
                                    type="button"
                                    className={styles.infoTrigger}
                                    onClick={() => addNotification({
                                        h2: 'Collected fee',
                                        desc: 'This is a system-collected charge that covers packing and delivery handling for this order. It is automatically calculated based on the order details and is included in the total amount charged to the customer.',
                                        tag: 'info',
                                    })}
                                    aria-label="What is the collected fee"
                                >
                                    <FaInfoCircle />
                                </button>
                            </th>
                            <th className={styles.headCell}>Where it's reached</th>
                            <th className={styles.headCell}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedList.map((order, idx) => {
                            const meta = rowMeta[idx];
                            const tintClass = meta.isGrouped ? styles[`comboTint${meta.colorIndex}`] : '';
                            const step = getCurrentStep(order.updates);
                            const latestLine = getLatestLine(step);
                            const { event, rest } = splitLine(latestLine);
                            const isDelivering = step?.title === 'Delivery' || step?.title?.toLowerCase().includes('deliver');

                            return (
                                <tr key={order.id} className={`${styles.row} ${tintClass}`}>
                                    <td className={styles.cell}>
                                        <div className={styles.productCell}>
                                            <img src={order.product?.image} alt={order.product?.title} className={styles.productImage} />
                                            <div>
                                                <div className={styles.orderIdLabel}>#{order.id}</div>
                                                <div className={styles.productName}>{order.product?.title}</div>
                                                <div className={styles.orderDate}>
                                                    {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                {meta.isGrouped && (
                                                    <span className={styles.comboBadge}>
                                                        <FaLink /> Packed together
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className={styles.cell}>
                                        <div className={styles.stackedInfo}>
                                            <span className={styles.primaryLine}>{order.address?.fullName}</span>
                                            <span className={styles.secondaryLine}>{order.address?.phone}</span>
                                        </div>
                                        <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'customer', id: order.id })}>
                                            Details <MdArrowRight />
                                        </button>
                                    </td>

                                    <td className={styles.cell}>
                                        <div className={styles.stackedInfo}>
                                            <span className={styles.money}>{formatMoney(order.amount ?? order.listedPrice)}</span>
                                            <span className={styles.secondaryLine}>{order.quantity ?? order.items} item{(order.quantity ?? order.items) === 1 ? '' : 's'}</span>
                                        </div>
                                        <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'price', id: order.id })}>
                                            Details <MdArrowRight />
                                        </button>
                                    </td>

                                    <td className={styles.cell}>
                                        <span className={`${styles.pill} ${order.payment_type === 'prepaid' || order.payment_type === 'prepaid'  ? styles.pillPrepaid : styles.pillCod}`}>
                                            {order.payment_type === 'prepaid' || order.payment_type === 'prepaid'  ? 'Prepaid' : 'COD'}
                                        </span>
                                    </td>

                                    <td className={styles.cell}>
                                        {order.warehouseName
                                            ? <span className={styles.whPill}>{order.warehouseName}</span>
                                            : <span className={styles.naText}>Not found</span>}
                                    </td>

                                    <td className={styles.cell}>
                                        {order.delivery_charge != null
                                            ? <span className={styles.money}>{formatMoney(order.delivery_charge)}</span>
                                            : <span className={styles.naText}>Not available</span>}
                                    </td>

                                    <td className={styles.cell}>
                                        {order.applied_additional_fee != null
                                            ? <span className={styles.money}>{formatMoney(order.applied_additional_fee)}</span>
                                            : <span className={styles.naText}>Not available</span>}
                                    </td>

                                    <td className={styles.cell}>
                                        <div className={styles.trackCell}>
                                            <span className={`${styles.trackBadge} ${isDelivering ? styles.trackBadgeMuted : styles.trackBadgeActive}`}>
                                                {isDelivering ? <FaCircle className={styles.trackDot} /> : <FaTruck className={styles.trackDot} />}
                                                {step?.title || 'Order Created'}
                                            </span>
                                            {latestLine ? (
                                                <span className={styles.trackLine} title={latestLine}>
                                                    {rest ? <><strong>{event}</strong>: {rest}</> : event}
                                                </span>
                                            ) : (
                                                <span className={styles.naText}>No tracking events yet</span>
                                            )}
                                            {order.updates?.lastUpdated && (
                                                <span className={styles.trackTime}>Updated {formatWhen(order.updates.lastUpdated)}</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className={styles.cell}>
                                        <button
                                            className={styles.linkBtn}
                                            onClick={() => setShowSomeThing({ type: 'full-timeline', id: order.id })}
                                        >
                                            Full timeline <MdArrowRight />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProcessingOrders;