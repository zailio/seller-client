'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './css/pickup.module.css';
import Wait from '../../../../components/wait';
import config from '../../../../utils/config';
import { MdArrowRight, MdOutlineSettingsBackupRestore } from 'react-icons/md';
import { ImSpinner2 } from 'react-icons/im';
import { FaEllipsisV, FaInfoCircle, FaBoxOpen, FaLink } from 'react-icons/fa';

const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
const COMBO_TINT_COUNT = 5; // number of tint classes defined in the CSS (.comboTint0..4)

// label size options sent to /seller/create-label as `label_size`
const LABEL_SIZES = [
    { value: 'a4', label: 'A4' },
    { value: '4x6', label: '4 x 6 in' },
];

const PickupOrders = ({
    pickup,
    session,
    auth,
    setShowSomeThing,
    addNotification,
    onOrderMoved, // parent-owned cache mutator: (orderId, fromTab, toTab)
}) => {
    const [checked, setChecked] = useState([]);
    const [proc, setProce] = useState(false);
    const [open, setOpen] = useState(false);
    const [backToConfirm, setBackToConfirm] = useState(false);
    const [labelFilter, setLabelFilter] = useState(0);
    const [labelSize, setLabelSize] = useState('a4');

    // orders visible under the current label-count filter
    const selectList = useMemo(() => {
        if (!Array.isArray(pickup)) return [];
        return pickup.filter(e => e.label_created == labelFilter);
    }, [pickup, labelFilter]);

    // group orders that share a non-null `apide` — these were packed together
    // and must be picked up as a single unit, so they get one shared checkbox
    // and a shared light background tint. Groups of size 1 (the sibling row
    // isn't visible under this filter) are treated as ungrouped.
    const comboGroups = useMemo(() => {
        const map = {};
        selectList.forEach(o => {
            if (!o.apide) return;
            if (!map[o.apide]) map[o.apide] = [];
            map[o.apide].push(o.id);
        });
        Object.keys(map).forEach(key => {
            if (map[key].length < 2) delete map[key];
        });
        return map;
    }, [selectList]);

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
        selectList.forEach(o => { map[o.id] = [o.id]; });
        Object.values(comboGroups).forEach(ids => {
            ids.forEach(id => { map[id] = ids; });
        });
        return map;
    }, [selectList, comboGroups]);

    // re-order so grouped rows sit next to each other (required for the
    // shared checkbox cell's rowSpan to make sense visually)
    const sortedList = useMemo(() => {
        const seen = new Set();
        const result = [];
        selectList.forEach(o => {
            if (seen.has(o.id)) return;
            result.push(o);
            seen.add(o.id);
            const groupIds = o.apide ? comboGroups[o.apide] : undefined;
            if (groupIds) {
                groupIds.forEach(id => {
                    if (id === o.id || seen.has(id)) return;
                    const match = selectList.find(x => x.id === id);
                    if (match) { result.push(match); seen.add(id); }
                });
            }
        });
        return result;
    }, [selectList, comboGroups]);

    // per-row metadata: is it grouped, is it the first row of its group
    // (only the first gets the rendered, rowSpan'd checkbox cell), group size, tint
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

    // reset selection whenever the tab's underlying data changes (e.g. after
    // a refetch triggered by onOrderMoved) — stale ids in `checked` could
    // otherwise reference rows that no longer exist
    useEffect(() => {
        setChecked([]);
    }, [pickup]);

    const makeLabel = async () => {
        setProce(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/create-label', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({
                    session_id: session,
                    order_ids: checked,
                    label_size: labelSize, // 'a4' | '4x6'
                }),
            });
            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            };
            const result = await res.json();
            if (result.data.status) {
                const pdfResponse = await fetch(result.data.dl_url);
                const blob = await pdfResponse.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = result.data.fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(link);
                }, 100);

                // label_created counts on the affected orders have changed,
                // which shifts which rows show under the current filter —
                // force the pickup tab to refetch rather than mutating locally
                setChecked([]);
                if (onOrderMoved) onOrderMoved(null, null, 'pickup');
            };
        } catch (e) {
            console.log(e);
            addNotification({
                h2: 'Error',
                desc: 'Label Creation Faild, try again latter',
                tag: 'error',
            });
        } finally {
            setProce(false);
        }
    };

    // toggling a grouped row's checkbox toggles every id in its group at once —
    // a combo pack can't be half-selected
    const handleChangeOfCheckBox = (e, id, selectAll = false) => {
        const isChecked = e.target.checked;
        if (selectAll) {
            setChecked(isChecked ? selectList.map(a => a.id) : []);
            return;
        }
        const groupIds = orderGroupMap[id] || [id];
        setChecked((prev) => {
            if (isChecked) return Array.from(new Set([...prev, ...groupIds]));
            return prev.filter((item) => !groupIds.includes(item));
        });
    };

    const toggleMenu = (order_id) => {
        setOpen(prev => (prev === order_id ? false : order_id));
    };

    const setToConfirm = async (id) => {
        setBackToConfirm(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/set-back-to-confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({
                    session_id: session,
                    order_id: id
                }),
            });
            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            };
            const result = await res.json();
            if (result.data.status) {
                setOpen(false);
                setChecked(prev => prev.filter(item => item !== id));
                if (onOrderMoved) onOrderMoved(id, 'pickup', 'confirmed');
            };
        } catch (e) {
            console.log(e);
            addNotification({
                h2: 'Error',
                desc: 'back set Creation Faild, try again latter',
                tag: 'error',
            });
        } finally {
            setBackToConfirm(false);
        }
    };

    if (pickup === false) return <Wait />;

    if (!pickup.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No pickup orders yet</p>
                <p className={styles.emptyBody}>Orders move here once you confirm and schedule them for pickup.</p>
            </div>
        );
    }

    const allChecked = checked.length > 0 && checked.length === selectList.length;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <div className={styles.toolbarActions}>
                    <select className={styles.selectBox} defaultValue="">
                        <option disabled value=''>Select All Specific product</option>
                        <option>hi</option>
                        <option>hi</option>
                        <option>hi</option>
                        <option>hi</option>
                    </select>
                </div>

                <div className={styles.toolbarActions}>
                    <select
                        className={styles.selectBox}
                        value={labelFilter}
                        onChange={(e) => {
                            setLabelFilter(Number(e.target.value));
                            setChecked([]);
                        }}
                    >
                        <option disabled value=''>Filter label count</option>
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                    </select>

                    <select
                        className={styles.selectBox}
                        value={labelSize}
                        onChange={(e) => setLabelSize(e.target.value)}
                        aria-label="Label size"
                    >
                        {LABEL_SIZES.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <button
                        className={styles.primaryBtn}
                        onClick={makeLabel}
                        disabled={proc || checked.length === 0}
                    >
                        {proc
                            ? <span className={styles.btnSpinner}><ImSpinner2 className={styles.spin} /> Creating…</span>
                            : `Create label${checked.length ? ` (${checked.length})` : ''}`}
                    </button>
                </div>
            </div>

            {!selectList.length ? (
                <div className={styles.emptyState}>
                    <FaBoxOpen className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No orders match this filter</p>
                    <p className={styles.emptyBody}>Try a different label count filter.</p>
                </div>
            ) : (
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
                                        aria-label="Select all pickup orders"
                                    />
                                </th>
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
                                <th className={styles.headCell}>Labels</th>
                                <th className={styles.headCell}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedList.map((order, idx) => {
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
                                            <span className={`${styles.pill} ${order.payment_type === 'prepaid'  ? styles.pillPrepaid : styles.pillCod}`}>
                                                {order.payment_type === 'prepaid'  ? 'Prepaid' : 'COD'}
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
                                            <span className={styles.labelCount}>{order.label_created}</span>
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
                                                {open === order.id && (
                                                    <div className={styles.moreActionsMenu}>
                                                        <button
                                                            className={styles.moreActionsOption}
                                                            disabled={backToConfirm}
                                                            onClick={() => setToConfirm(order.id)}
                                                        >
                                                            {backToConfirm
                                                                ? <span className={styles.btnSpinner}><ImSpinner2 className={styles.spin} /> Please wait…</span>
                                                                : <>
                                                                    <MdOutlineSettingsBackupRestore className={styles.moreActionsIcon} />
                                                                    <span>Set back to confirmed</span>
                                                                </>
                                                            }
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PickupOrders;