'use client';

import { useMemo, useState } from 'react';
import styles from './css/confirm.module.css';
import Wait from '../../../../components/wait';
import MoreActions from './actions';
import config from '../../../../utils/config';
import { MdArrowRight } from 'react-icons/md';
import { FaEllipsisV, FaInfoCircle, FaBoxOpen, FaLink } from 'react-icons/fa';
import { ImSpinner2 } from 'react-icons/im';

const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
const COMBO_TINT_COUNT = 5; // number of tint classes defined in the CSS (.comboTint0..4)

const ConfirmOrders = ({
    toggleMenu,
    confirmed,
    loading,
    openMenus,
    activeTab,
    setShowSomeThing,
    setShowResone,
    session,
    auth,
    warehouse,
    addNotification,
    onOrderMoved
}) => {
    const [checked, setChecked] = useState([]);
    const [proc, setProce] = useState(false);
    const [selectedWareHouse, setSellectedWareHouse] = useState(false);

    // group orders that share a non-null `apide` — these were packed together
    // and must be picked up as a single unit, so they get one shared checkbox
    // and a shared light background tint. Groups of size 1 (the sibling row
    // isn't on this tab) are treated as ungrouped.
    const comboGroups = useMemo(() => {
        if (!Array.isArray(confirmed)) return {};
        const map = {};
        confirmed.forEach(o => {
            if (!o.apide) return;
            if (!map[o.apide]) map[o.apide] = [];
            map[o.apide].push(o.id);
        });
        Object.keys(map).forEach(key => {
            if (map[key].length < 2) delete map[key];
        });
        return map;
    }, [confirmed]);

    // apide -> tint index, stable for the lifetime of this render
    const comboColorIndex = useMemo(() => {
        const map = {};
        Object.keys(comboGroups).forEach((key, idx) => {
            map[key] = idx % COMBO_TINT_COUNT;
        });
        return map;
    }, [comboGroups]);

    // order id -> every id in its group (including itself); [id] if ungrouped
    const orderGroupMap = useMemo(() => {
        const map = {};
        if (!Array.isArray(confirmed)) return map;
        confirmed.forEach(o => { map[o.id] = [o.id]; });
        Object.values(comboGroups).forEach(ids => {
            ids.forEach(id => { map[id] = ids; });
        });
        return map;
    }, [confirmed, comboGroups]);

    // re-order so grouped rows sit next to each other (required for the
    // shared checkbox cell's rowSpan to make sense visually)
    const sortedConfirmed = useMemo(() => {
        if (!Array.isArray(confirmed)) return [];
        const seen = new Set();
        const result = [];
        confirmed.forEach(o => {
            if (seen.has(o.id)) return;
            result.push(o);
            seen.add(o.id);
            const groupIds = o.apide ? comboGroups[o.apide] : undefined;
            if (groupIds) {
                groupIds.forEach(id => {
                    if (id === o.id || seen.has(id)) return;
                    const match = confirmed.find(x => x.id === id);
                    if (match) { result.push(match); seen.add(id); }
                });
            }
        });
        return result;
    }, [confirmed, comboGroups]);

    // per-row metadata: is it grouped, is it the first row of its group
    // (only the first gets the rendered, rowSpan'd checkbox cell), group size, tint
    const rowMeta = useMemo(() => {
        const seenGroupStart = new Set();
        return sortedConfirmed.map(o => {
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
    }, [sortedConfirmed, comboGroups, comboColorIndex]);

    const makePickup = async () => {
        if (!selectedWareHouse) {
            addNotification({ h2: 'Error', desc: 'Please choose a warehouse, if not found create one from the delivery tab' });
            return;
        }
        setProce(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/create-pickup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
                body: JSON.stringify({ session_id: session, order_ids: checked, warehouseName: selectedWareHouse.name }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                checked.forEach(id => onOrderMoved?.(id, 'confirmed', 'pickup'));
                setChecked([]);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setProce(false);
        }
    };

    // toggling a grouped row's checkbox toggles every id in its group at once —
    // a combo pack can't be half-selected
    const handleChangeOfCheckBox = (e, id, selectAll = false) => {
        const isChecked = e.target.checked;
        if (selectAll) {
            setChecked(isChecked ? confirmed.map(a => a.id) : []);
            return;
        }
        const groupIds = orderGroupMap[id] || [id];
        setChecked(prev => {
            if (isChecked) return Array.from(new Set([...prev, ...groupIds]));
            return prev.filter(item => !groupIds.includes(item));
        });
    };

    if (confirmed === false || loading) return <Wait />;

    if (!confirmed.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No confirmed orders yet</p>
                <p className={styles.emptyBody}>Orders move here once you confirm them from the Pending tab.</p>
            </div>
        );
    }

    const allChecked = checked.length === confirmed.length;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.warehouseStatus}>
                    <span className={`${styles.statusDot} ${selectedWareHouse ? styles.statusDotOn : styles.statusDotOff}`} />
                    {selectedWareHouse
                        ? <span>Dispatching from <strong>{selectedWareHouse.name}</strong></span>
                        : <span className={styles.warehouseMissing}>No warehouse selected</span>}
                </div>

                <div className={styles.toolbarActions}>
                    <select
                        className={styles.selectBox}
                        defaultValue=""
                        onChange={(e) => setSellectedWareHouse(warehouse.find(w => w.name === e.target.value))}
                    >
                        <option disabled value="">Select warehouse</option>
                        {Array.isArray(warehouse) ? warehouse.map((w, id) => (
                            <option key={'wh' + id} value={w.name}>{w.name}</option>
                        )) : null}
                    </select>

                    <button
                        className={styles.primaryBtn}
                        onClick={makePickup}
                        disabled={checked.length === 0 || proc}
                    >
                        {proc
                            ? <span className={styles.btnSpinner}><ImSpinner2 className={styles.spin} /> Scheduling…</span>
                            : `Schedule pickup${checked.length ? ` (${checked.length})` : ''}`}
                    </button>
                </div>
            </div>

            <div className={styles.tableScroll}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.headCell}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={allChecked}
                                    onChange={(e) => handleChangeOfCheckBox(e, null, true)}
                                    aria-label="Select all confirmed orders"
                                />
                            </th>
                            <th className={styles.headCell}>Order</th>
                            <th className={styles.headCell}>Customer</th>
                            <th className={styles.headCell}>Amount</th>
                            <th className={styles.headCell}>Payment</th>
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
                            <th className={styles.headCell}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedConfirmed.map((order, idx) => {
                            const meta = rowMeta[idx];
                            const tintClass = meta.isGrouped ? styles[`comboTint${meta.colorIndex}`] : '';
                            return (
                                <tr key={order.id} className={`${styles.row} ${tintClass}`}>
                                    {meta.isGroupStart && (
                                        <td className={`${styles.cell} ${styles.checkboxCell}`} rowSpan={meta.groupSize}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={checked.includes(order.id)}
                                                onChange={(e) => handleChangeOfCheckBox(e, order.id)}
                                                aria-label={meta.isGrouped
                                                    ? `Select combo pack of ${meta.groupSize} orders starting at ${order.id}`
                                                    : `Select order ${order.id}`}
                                            />
                                        </td>
                                    )}

                                    <td className={styles.cell}>
                                        <div className={styles.productCell}>
                                            <img src={order.product.image} alt={order.product.title} className={styles.productImage} />
                                            <div>
                                                <div className={styles.orderIdLabel}>#{order.id}</div>
                                                <div className={styles.productName}>{order.product.title}</div>
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
                                            <span className={styles.primaryLine}>{order.address.fullName}</span>
                                            <span className={styles.secondaryLine}>{order.address.phone}</span>
                                        </div>
                                        <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'customer', id: order.id })}>
                                            Details <MdArrowRight />
                                        </button>
                                    </td>

                                    <td className={styles.cell}>
                                        <div className={styles.stackedInfo}>
                                            <span className={styles.money}>{formatMoney(order.amount)}</span>
                                            <span className={styles.secondaryLine}>{order.items} item{order.items === 1 ? '' : 's'}</span>
                                        </div>
                                        <button className={styles.linkBtn} onClick={() => setShowSomeThing({ type: 'price', id: order.id })}>
                                            Details <MdArrowRight />
                                        </button>
                                    </td>

                                    <td className={styles.cell}>
                                        <span className={`${styles.pill} ${order.payment_type === 'prepaid' ? styles.pillPrepaid : styles.pillCod}`}>
                                            {order.payment_type === 'prepaid' ? 'Prepaid' : 'COD'}
                                        </span>
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
                                        <div className={styles.actionsCell}>
                                            <button
                                                className={styles.moreBtn}
                                                onClick={() => toggleMenu(order.id)}
                                                aria-label="More actions"
                                            >
                                                <FaEllipsisV />
                                            </button>
                                            {openMenus[order.id] && (activeTab === 'pending' || activeTab === 'confirmed') && (
                                                <MoreActions
                                                    activeTab={activeTab}
                                                    setShowSomeThing={setShowSomeThing}
                                                    order={order}
                                                    session={session}
                                                    auth={auth}
                                                    setShowResone={setShowResone}
                                                    toggleMenu={toggleMenu}
                                                />
                                            )}
                                        </div>
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

export default ConfirmOrders;