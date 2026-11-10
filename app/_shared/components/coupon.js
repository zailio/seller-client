'use client';

import { useEffect, useState } from 'react';
import {
    FiTag, FiPlus, FiEdit2, FiCheck, FiX, FiSlash, FiPlay,
    FiChevronDown, FiChevronUp, FiUsers, FiCalendar,
    FiToggleLeft, FiToggleRight, FiPercent, FiDollarSign
} from 'react-icons/fi';
import styles from './css/coupon.module.css';
import Wait from '../../../components/wait';

import config from '../../../utils/config';

const emptyForm = {
    code: '',
    count: '',
    discount: '',
    discount_type: 'percentage',
    minimum_amount: '',
    minimum_profit: '',
    is_public: true,
    one_time_use: false
};

const CouponManage = ({
    auth, session,
    coupons, setCoupons,
    addNotification
}) => {
    const [isLoading, setIsLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [savingId, setSavingId] = useState(null);

    const [expandedId, setExpandedId] = useState(null);
    const [usageMap, setUsageMap] = useState({});
    const [usageLoadingId, setUsageLoadingId] = useState(null);

    const [showCreate, setShowCreate] = useState(false);
    const [newCoupon, setNewCoupon] = useState(emptyForm);
    const [creating, setCreating] = useState(false);

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

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const data = await callApi('list-coupons');
            setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
        } catch (err) {
            console.error('fetchCoupons error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load coupons. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const toggleCouponStatus = async (coupon) => {
        const next = !coupon.status;
        if (!next && !confirm('Turn off this coupon? It will stop working for new orders.')) return;

        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: next } : c));
        try {
            await callApi('update-coupon-status', { coupon_id: coupon.id, status: next });
            addNotification({ h2: 'Success', desc: `Coupon ${next ? 'activated' : 'deactivated'} successfully.` });
        } catch (err) {
            console.error('toggleCouponStatus error:', err);
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: coupon.status } : c));
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not update status. Please try again.' });
        }
    };

    const toggleIsPublic = async (coupon) => {
        const next = !coupon.is_public;
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_public: next } : c));
        try {
            await callApi('toggle-coupon-public', { coupon_id: coupon.id });
            addNotification({ h2: 'Success', desc: `Coupon is now ${next ? 'public' : 'private'}.` });
        } catch (err) {
            console.error('toggleIsPublic error:', err);
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_public: coupon.is_public } : c));
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not update visibility. Please try again.' });
        }
    };

    const toggleOneTimeUse = async (coupon) => {
        const next = !coupon.one_time_use;
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, one_time_use: next } : c));
        try {
            await callApi('update-coupon', { coupon_id: coupon.id, one_time_use: next });
            addNotification({ h2: 'Success', desc: `One-time-use per customer ${next ? 'enabled' : 'disabled'}.` });
        } catch (err) {
            console.error('toggleOneTimeUse error:', err);
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, one_time_use: coupon.one_time_use } : c));
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not update setting. Please try again.' });
        }
    };

    const startEdit = (coupon) => {
        setEditingId(coupon.id);
        setEditForm({
            count: coupon.count ?? '',
            discount: coupon.discount ?? '',
            discount_type: coupon.discount_type ?? 'percentage',
            minimum_amount: coupon.minimum_amount ?? '',
            minimum_profit: coupon.minimum_profit ?? ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id) => {
        setSavingId(id);
        try {
            const payload = {
                coupon_id: id,
                count: editForm.count === '' ? null : Number(editForm.count),
                discount: editForm.discount === '' ? 0 : Number(editForm.discount),
                discount_type: editForm.discount_type,
                minimum_amount: editForm.minimum_amount === '' ? null : Number(editForm.minimum_amount),
                minimum_profit: editForm.minimum_profit === '' ? null : Number(editForm.minimum_profit)
            };
            await callApi('update-coupon', payload);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
            setEditingId(null);
            setEditForm({});
            addNotification({ h2: 'Success', desc: 'Coupon updated successfully.' });
        } catch (err) {
            console.error('saveEdit error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not save changes. Please try again.' });
        } finally {
            setSavingId(null);
        }
    };

    const toggleUsage = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (usageMap[id]) return;

        setUsageLoadingId(id);
        try {
            const data = await callApi('coupon-usage', { coupon_id: id });
            setUsageMap(prev => ({ ...prev, [id]: Array.isArray(data.users) ? data.users : [] }));
        } catch (err) {
            console.error('toggleUsage error:', err);
            setUsageMap(prev => ({ ...prev, [id]: [] }));
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load usage. Please try again.' });
        } finally {
            setUsageLoadingId(null);
        }
    };

    const createCoupon = async () => {
        if (!newCoupon.code.trim() || newCoupon.discount === '' || newCoupon.count === '') {
            addNotification({ h2: 'Error occurred', desc: 'Code, count and discount are required.' });
            return;
        }
        setCreating(true);
        try {
            const payload = {
                code: newCoupon.code.trim().toUpperCase(),
                count: Number(newCoupon.count),
                discount: Number(newCoupon.discount),
                discount_type: newCoupon.discount_type,
                minimum_amount: newCoupon.minimum_amount === '' ? null : Number(newCoupon.minimum_amount),
                minimum_profit: newCoupon.minimum_profit === '' ? null : Number(newCoupon.minimum_profit),
                is_public: newCoupon.is_public,
                one_time_use: newCoupon.one_time_use
            };
            const data = await callApi('create-coupon', payload);
            setCoupons(prev => [data.coupon, ...prev]);
            setNewCoupon(emptyForm);
            setShowCreate(false);
            addNotification({ h2: 'Success', desc: 'Coupon created successfully.' });
        } catch (err) {
            console.error('createCoupon error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not create coupon. Please try again.' });
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return '—';
        }
    };

    const formatDiscount = (c) => c.discount_type === 'percentage' ? `${c.discount}%` : `₹${c.discount}`;

    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <h2 className={styles.pageTitle}><FiTag /> Coupons</h2>
                <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
                    <FiPlus /> New Coupon
                </button>
            </div>

            {showCreate && (
                <div className={styles.modalOverlay} onClick={() => !creating && setShowCreate(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Create Coupon</h3>

                        <div className={styles.formRow}>
                            <label>Code</label>
                            <input
                                type="text"
                                placeholder="SAVE20"
                                value={newCoupon.code}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <label>Discount type</label>
                            <select
                                value={newCoupon.discount_type}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, discount_type: e.target.value }))}
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>

                        <div className={styles.formRow}>
                            <label>Discount value</label>
                            <input
                                type="number"
                                placeholder={newCoupon.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                                value={newCoupon.discount}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, discount: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <label>Usage count limit</label>
                            <input
                                type="number"
                                placeholder="e.g. 100"
                                value={newCoupon.count}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, count: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <label>Minimum product amount</label>
                            <input
                                type="number"
                                placeholder="Optional"
                                value={newCoupon.minimum_amount}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, minimum_amount: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <label>Minimum product profit</label>
                            <input
                                type="number"
                                placeholder="Optional"
                                value={newCoupon.minimum_profit}
                                onChange={(e) => setNewCoupon(prev => ({ ...prev, minimum_profit: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formRowInline}>
                            <label>Public coupon</label>
                            <span
                                className={styles.switch}
                                onClick={() => setNewCoupon(prev => ({ ...prev, is_public: !prev.is_public }))}
                            >
                                {newCoupon.is_public ? <FiToggleRight className={styles.switchOn} /> : <FiToggleLeft className={styles.switchOff} />}
                            </span>
                        </div>

                        <div className={styles.formRowInline}>
                            <label>One use per customer</label>
                            <span
                                className={styles.switch}
                                onClick={() => setNewCoupon(prev => ({ ...prev, one_time_use: !prev.one_time_use }))}
                            >
                                {newCoupon.one_time_use ? <FiToggleRight className={styles.switchOn} /> : <FiToggleLeft className={styles.switchOff} />}
                            </span>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} disabled={creating} onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className={styles.saveBtn} disabled={creating} onClick={createCoupon}>
                                {creating ? 'Creating…' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading ? (
                <Wait />
            ) : coupons.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiTag className={styles.emptyIcon} />
                    <p>No coupons yet. Create one to get started.</p>
                </div>
            ) : (
                <div className={styles.table}>
                    <div className={`${styles.row} ${styles.headRow}`}>
                        <span className={styles.colCode}>Code</span>
                        <span className={styles.colDiscount}>Discount</span>
                        <span className={styles.colMin}>Min. Amount</span>
                        <span className={styles.colMin}>Min. Profit</span>
                        <span className={styles.colCount}>Uses</span>
                        <span className={styles.colToggle}>Public</span>
                        <span className={styles.colToggle}>One Use</span>
                        <span className={styles.colToggle}>Status</span>
                        <span className={styles.colDate}>Created</span>
                        <span className={styles.colActions}>Actions</span>
                    </div>

                    {coupons.map((coupon) => {
                        const isEditing = editingId === coupon.id;
                        const isExpanded = expandedId === coupon.id;
                        return (
                            <div key={coupon.id} className={styles.rowGroup}>
                                <div className={styles.row}>
                                    <span className={styles.colCode}>
                                        <span className={styles.codeChip}>{coupon.code}</span>
                                    </span>

                                    <span className={styles.colDiscount}>
                                        {isEditing ? (
                                            <div className={styles.editInline}>
                                                <select
                                                    value={editForm.discount_type}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, discount_type: e.target.value }))}
                                                >
                                                    <option value="percentage">%</option>
                                                    <option value="fixed">₹</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={editForm.discount}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, discount: e.target.value }))}
                                                />
                                            </div>
                                        ) : (
                                            <span className={styles.discountBadge}>
                                                {coupon.discount_type === 'percentage' ? <FiPercent /> : <FiDollarSign />}
                                                {formatDiscount(coupon)}
                                            </span>
                                        )}
                                    </span>

                                    <span className={styles.colMin}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                placeholder="—"
                                                value={editForm.minimum_amount}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, minimum_amount: e.target.value }))}
                                            />
                                        ) : (
                                            coupon.minimum_amount != null ? `₹${coupon.minimum_amount}` : '—'
                                        )}
                                    </span>

                                    <span className={styles.colMin}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                placeholder="—"
                                                value={editForm.minimum_profit}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, minimum_profit: e.target.value }))}
                                            />
                                        ) : (
                                            coupon.minimum_profit != null ? `₹${coupon.minimum_profit}` : '—'
                                        )}
                                    </span>

                                    <span className={styles.colCount}>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editForm.count}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, count: e.target.value }))}
                                            />
                                        ) : (
                                            <button className={styles.usageBtn} onClick={() => toggleUsage(coupon.id)}>
                                                <FiUsers /> Usage
                                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                            </button>
                                        )}
                                    </span>

                                    <span className={styles.colToggle}>
                                        <span className={styles.switch} onClick={() => toggleIsPublic(coupon)}>
                                            {coupon.is_public
                                                ? <FiToggleRight className={styles.switchOn} />
                                                : <FiToggleLeft className={styles.switchOff} />}
                                        </span>
                                    </span>

                                    <span className={styles.colToggle}>
                                        <span
                                            className={styles.switch}
                                            title="Limit to one redemption per customer"
                                            onClick={() => toggleOneTimeUse(coupon)}
                                        >
                                            {coupon.one_time_use
                                                ? <FiToggleRight className={styles.switchOn} />
                                                : <FiToggleLeft className={styles.switchOff} />}
                                        </span>
                                    </span>

                                    <span className={styles.colToggle}>
                                        <button
                                            className={`${styles.statusPill} ${coupon.status ? styles.statusActive : styles.statusInactive}`}
                                            onClick={() => toggleCouponStatus(coupon)}
                                        >
                                            {coupon.status ? 'Active' : 'Inactive'}
                                        </button>
                                    </span>

                                    <span className={styles.colDate}>
                                        <span className={styles.dateChip}><FiCalendar /> {formatDate(coupon.createdAt)}</span>
                                    </span>

                                    <span className={styles.colActions}>
                                        {isEditing ? (
                                            <>
                                                <button
                                                    className={styles.iconBtnConfirm}
                                                    disabled={savingId === coupon.id}
                                                    onClick={() => saveEdit(coupon.id)}
                                                >
                                                    <FiCheck />
                                                </button>
                                                <button className={styles.iconBtnCancel} onClick={cancelEdit}>
                                                    <FiX />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button className={styles.iconBtn} onClick={() => startEdit(coupon)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className={coupon.status ? styles.iconBtnDanger : styles.iconBtnConfirm}
                                                    title={coupon.status ? 'Turn off' : 'Turn on'}
                                                    onClick={() => toggleCouponStatus(coupon)}
                                                >
                                                    {coupon.status ? <FiSlash /> : <FiPlay />}
                                                </button>
                                            </>
                                        )}
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className={styles.usagePanel}>
                                        {usageLoadingId === coupon.id ? (
                                            <Wait />
                                        ) : (usageMap[coupon.id] && usageMap[coupon.id].length > 0) ? (
                                            <div className={styles.usageList}>
                                                {usageMap[coupon.id].map((u, i) => (
                                                    <div key={u.id ?? i} className={styles.usageItem}>
                                                        <span className={styles.usageName}>{u.name || u.username || `User #${u.user_id ?? i}`}</span>
                                                        <span className={styles.usageDate}>{formatDate(u.usedAt || u.createdAt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.usageEmpty}>No one has used this coupon yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CouponManage;