'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    FiPackage, FiCalendar, FiClock, FiCheck, FiFilter, FiX, FiInbox,
    FiPlus, FiEdit2, FiTrash2, FiPercent, FiCreditCard, FiAlertCircle,
    FiCheckCircle, FiTag, FiBox, FiPause, FiPlay
} from 'react-icons/fi';
import styles from './page.module.css';
import Wait from '../../../components/wait';
import config from '../../../utils/config';

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */
/*
  POST/GET  /seller/preorder/...
  ''          GET   out-of-stock products (each has `can_preorder`)
  details     POST  rows for every product with can_preorder === true
  add         POST  create pre-orders (rows[] incl. stock_count = restock quantity)
  update      POST  edit date / confirmed / quantity / discount / pay %
  toggle      POST  live <-> paused (status true/false)
  schedule    POST  set / pause / resume / clear an automatic start + end
  delete      POST  switches the pre-order off (status false) and saves the reason.
                    The row is NEVER erased.

  Pre-order row:
  {
    product_id, restock_date, confirmed_date, stock_count, preorder_discount,
    final_rate, preorder_percentage, status, reason,
    schedule_start, schedule_end, schedule_enabled, schedule_state ('waiting'|'running'|'ended'|null)
  }
*/

const request = async (path, auth, { method = 'GET', data = {} } = {}) => {
    const isGet = method === 'GET';
    const url = isGet
        ? `${config.SERVER_URL}/seller/preorder/${path}?${new URLSearchParams(data)}`
        : `${config.SERVER_URL}/seller/preorder/${path}`;

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`,
        },
        ...(isGet ? {} : { body: JSON.stringify(data) }),
    });

    const json = await res.json();
    if (!json.status || json.data?.status === false) {
        throw new Error(json.data?.message || 'Request failed');
    }
    return json.data;
};

const api = {
    // 1) all out-of-stock products (with can_preorder flag)
    async getProducts(auth, session_id) {
        const data = await request('', auth, { method: 'GET', data: { session_id } });
        return Array.isArray(data?.data) ? data.data : [];
    },

    // 2) pre-order details for every product that already has can_preorder === true
    async getPreorderInfo(auth, session_id, product_ids) {
        if (!product_ids.length) return [];
        const data = await request('details', auth, {
            method: 'POST',
            data: { session_id, product_ids },
        });
        return Array.isArray(data?.data) ? data.data : [];
    },

    // 3) add new pre-orders -> returns rows[]
    async savePreorders(auth, session_id, rows) {
        const data = await request('add', auth, { method: 'POST', data: { session_id, rows } });
        return Array.isArray(data?.data) ? data.data : [];
    },

    // 4) edit one pre-order -> returns the updated row
    async updatePreorder(auth, session_id, row) {
        const data = await request('update', auth, { method: 'POST', data: { session_id, ...row } });
        return data.data;
    },

    // 5) live / paused -> returns the updated row
    async setStatus(auth, session_id, product_id, status) {
        const data = await request('toggle', auth, { method: 'POST', data: { session_id, product_id, status } });
        return data.data;
    },

    // 6) schedule: { product_id, schedule_start, schedule_end, schedule_enabled } | { product_id, schedule_enabled } | { product_id, clear: true }
    async setSchedule(auth, session_id, payload) {
        const data = await request('schedule', auth, { method: 'POST', data: { session_id, ...payload } });
        return data.data;
    },

    // 7) delete = status false + reason (row stays in the table)
    async removePreorders(auth, session_id, product_ids, reason) {
        const data = await request('delete', auth, { method: 'POST', data: { session_id, product_ids, reason } });
        return data.data;
    },
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const PAY_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const MIN_REASON_WORDS = 20;

const PRICE_RANGES = [
    { value: 'all', label: 'All prices', test: () => true },
    { value: 'low', label: 'Under ₹1,000', test: (v) => v < 1000 },
    { value: 'mid', label: '₹1,000 - ₹5,000', test: (v) => v >= 1000 && v <= 5000 },
    { value: 'high', label: 'Above ₹5,000', test: (v) => v > 5000 },
];

const STATUS_FILTERS = [
    { value: 'all', label: 'All products' },
    { value: 'available', label: 'Not in pre-order' },
    { value: 'preorder', label: 'In pre-order' },
    { value: 'tentative', label: 'Tentative date' },
];

const inr = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

// current selling price of a product (from the product list API)
const priceOf = (p) => Number(p?.prepaid_rate ?? p?.price ?? 0);

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

const fmtDate = (v) =>
    v
        ? new Date(`${dateOnly(v)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

const fmtDateTime = (v) =>
    v
        ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
        : '—';

const pad = (n) => String(n).padStart(2, '0');

// ISO -> value for <input type="datetime-local">
const toLocalInput = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysLeft = (v) => Math.ceil((new Date(`${dateOnly(v)}T00:00:00`).getTime() - Date.now()) / 86400000);

const countWords = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;

// offer maths from the CURRENT price (used in the modal preview)
const calcOffer = (price, discountPct, payPct) => {
    const d = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
    const finalRate = Math.round(price * (1 - d / 100) * 100) / 100;
    const payNow = Math.round(finalRate * (Number(payPct) / 100) * 100) / 100;
    return { finalRate, payNow, balance: Math.round((finalRate - payNow) * 100) / 100 };
};

// restock quantity must be a whole number, at least 1
const validQty = (v) => /^\d+$/.test(String(v).trim()) && Number(v) >= 1;

// text + pill shown on the card for a schedule
const scheduleInfo = (pre) => {
    if (!pre?.schedule_start) return null;
    const range = `${fmtDateTime(pre.schedule_start)} → ${pre.schedule_end ? fmtDateTime(pre.schedule_end) : 'no end'}`;
    if (!pre.schedule_enabled) return { range, label: 'Paused', cls: 'pillWarn', state: pre.schedule_state };
    if (pre.schedule_state === 'waiting') return { range, label: 'Waiting', cls: 'pillWarn', state: 'waiting' };
    if (pre.schedule_state === 'running') return { range, label: 'Running', cls: 'pillOk', state: 'running' };
    return { range, label: 'Ended', cls: 'pillGray', state: 'ended' };
};

/* ------------------------------------------------------------------ */
/* ADD / EDIT MODAL                                                    */
/* ------------------------------------------------------------------ */

const PreorderModal = ({ items, existingMap, saving, onClose, onSave }) => {
    const single = items.length === 1;
    const first = items[0];
    const base = single ? existingMap.get(first.id) : null;

    const [restockDate, setRestockDate] = useState(dateOnly(base?.restock_date));
    const [confirmed, setConfirmed] = useState(!!base?.confirmed_date);
    const [discount, setDiscount] = useState(base?.preorder_discount ?? 0);
    const [payPct, setPayPct] = useState(base?.preorder_percentage ?? 10);
    const [error, setError] = useState('');

    // restock quantity per product: { [productId]: '25' }
    const [qty, setQty] = useState(() =>
        Object.fromEntries(
            items.map((p) => {
                const old = existingMap.get(p.id)?.stock_count;
                return [p.id, old ? String(old) : ''];
            })
        )
    );

    const setOneQty = (id, value) => {
        setQty((prev) => ({ ...prev, [id]: value.replace(/\D/g, '') }));
        setError('');
    };

    // live price for EVERY product in this pre-order (recalculated as discount / pay % change)
    const rows = useMemo(
        () => items.map((p) => ({ p, price: priceOf(p), ...calcOffer(priceOf(p), discount, payPct) })),
        [items, discount, payPct]
    );
    const preview = rows[0];
    const totalPayNow = rows.reduce((s, r) => s + r.payNow, 0);
    const totalBalance = rows.reduce((s, r) => s + r.balance, 0);

    const submit = (e) => {
        e.preventDefault();
        if (!restockDate) return setError('Please choose an expected restock date.');
        if (restockDate < todayIso()) return setError('Restock date cannot be in the past.');

        const missing = items.find((p) => !validQty(qty[p.id] ?? ''));
        if (missing) {
            return setError(
                single
                    ? 'Enter the restock quantity (1 or more).'
                    : `Enter a restock quantity for “${missing.title}”.`
            );
        }

        const d = Number(discount);
        if (Number.isNaN(d) || d < 0 || d > 90) return setError('Prepaid discount must be between 0 and 90%.');

        onSave(
            items.map((p) => ({
                product_id: p.id,
                restock_date: restockDate,
                confirmed_date: confirmed,
                stock_count: Number(qty[p.id]), // restock quantity
                preorder_discount: d,
                preorder_percentage: Number(payPct),
            }))
        );
    };

    return (
        <div className={styles.overlay} onClick={saving ? undefined : onClose}>
            <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className={styles.modalHead}>
                    <div>
                        <h3>{base ? 'Edit pre-order' : 'Add to pre-order'}</h3>
                        <p>{single ? first.title : `${items.length} products selected`}</p>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {/* left column: form fields */}
                    <div className={styles.colForm}>
                        <div className={styles.field}>
                            <label className={styles.label}><FiCalendar /> Expected restock date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={restockDate}
                                min={todayIso()}
                                onChange={(e) => { setRestockDate(e.target.value); setError(''); }}
                            />
                            <label className={`${styles.tick} ${confirmed ? styles.tickOn : ''}`}>
                                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                                <span className={styles.tickBox}>{confirmed && <FiCheck />}</span>
                                <span className={styles.tickText}>
                                    Date is confirmed
                                    <small>
                                        {confirmed
                                            ? 'Customers will see this as a confirmed date.'
                                            : 'Not ticked: customers will see “date may change”.'}
                                    </small>
                                </span>
                            </label>
                        </div>

                        {/* ---------- restock quantity ---------- */}
                        <div className={styles.field}>
                            <label className={styles.label}><FiBox /> Restock quantity</label>
                            {single ? (
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className={styles.input}
                                    placeholder="e.g. 50"
                                    value={qty[first.id] ?? ''}
                                    onChange={(e) => setOneQty(first.id, e.target.value)}
                                />
                            ) : (
                                <div className={styles.qtyList}>
                                    {items.map((p) => (
                                        <div key={p.id} className={styles.qtyRow}>
                                            <span className={styles.qtyName} title={p.title}>{p.title}</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className={`${styles.input} ${styles.qtyInput}`}
                                                placeholder="Qty"
                                                value={qty[p.id] ?? ''}
                                                onChange={(e) => setOneQty(p.id, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <small className={styles.hint}>How many units you expect to receive on the restock date.</small>
                        </div>

                        <div className={styles.twoCol}>
                            <div className={styles.field}>
                                <label className={styles.label}><FiPercent /> Prepaid discount (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="90"
                                    step="0.5"
                                    className={styles.input}
                                    value={discount}
                                    onChange={(e) => { setDiscount(e.target.value); setError(''); }}
                                />
                                <small className={styles.hint}>0 = no prepaid offer</small>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}><FiCreditCard /> Pay now to pre-order</label>
                                <select className={styles.input} value={payPct} onChange={(e) => setPayPct(Number(e.target.value))}>
                                    {PAY_OPTIONS.map((p) => (
                                        <option key={p} value={p}>{p}%</option>
                                    ))}
                                </select>
                                <small className={styles.hint}>Balance is paid before delivery</small>
                            </div>
                        </div>
                    </div>

                    {/* right column: live price preview */}
                    <div className={styles.colPreview}>
                        {single ? (
                            <div className={styles.preview}>
                                <div className={styles.previewTitle}>
                                    Live price preview
                                    <span>based on current price</span>
                                </div>
                                <div className={styles.previewRow}><span>Current price</span><strong>{inr.format(preview.price)}</strong></div>
                                <div className={styles.previewRow}>
                                    <span>Prepaid offer price</span>
                                    <strong className={styles.accent}>
                                        {inr.format(preview.finalRate)}
                                        {Number(discount) > 0 && <em className={styles.badge}>-{Number(discount)}%</em>}
                                    </strong>
                                </div>
                                <div className={styles.previewRow}><span>Pay now ({payPct}%)</span><strong>{inr.format(preview.payNow)}</strong></div>
                                <div className={styles.previewRow}><span>Balance later</span><strong>{inr.format(preview.balance)}</strong></div>
                            </div>
                        ) : (
                            <div className={styles.preview}>
                                <div className={styles.previewTitle}>
                                    Live price preview
                                    <span>{items.length} products · updates as you type</span>
                                </div>

                                <div className={styles.previewList}>
                                    {rows.map((r) => (
                                        <div key={r.p.id} className={styles.previewItem}>
                                            <div className={styles.previewItemName} title={r.p.title}>{r.p.title}</div>
                                            <div className={styles.previewGrid}>
                                                <div><span>Current</span><strong>{inr.format(r.price)}</strong></div>
                                                <div>
                                                    <span>Prepaid{Number(discount) > 0 ? ` (-${Number(discount)}%)` : ''}</span>
                                                    <strong className={styles.accent}>{inr.format(r.finalRate)}</strong>
                                                </div>
                                                <div><span>Pay now ({payPct}%)</span><strong>{inr.format(r.payNow)}</strong></div>
                                                <div><span>Balance</span><strong>{inr.format(r.balance)}</strong></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.previewRow}><span>Total pay now</span><strong>{inr.format(totalPayNow)}</strong></div>
                                <div className={styles.previewRow}><span>Total balance later</span><strong>{inr.format(totalBalance)}</strong></div>
                            </div>
                        )}
                    </div>
                </div>

                {error && <div className={styles.error}><FiAlertCircle /> {error}</div>}

                <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className={styles.primaryBtn} disabled={saving}>
                        {saving ? 'Saving…' : base ? 'Save changes' : single ? 'Add to pre-order' : `Add ${items.length} products`}
                    </button>
                </div>
            </form>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* SCHEDULE MODAL                                                      */
/* ------------------------------------------------------------------ */

const ScheduleModal = ({ product, pre, saving, onClose, onSave, onClear }) => {
    const hasSchedule = !!pre?.schedule_start;

    const [start, setStart] = useState(toLocalInput(pre?.schedule_start));
    const [end, setEnd] = useState(toLocalInput(pre?.schedule_end));
    const [enabled, setEnabled] = useState(hasSchedule ? !!pre.schedule_enabled : true);
    const [error, setError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        if (!start) return setError('Choose when the pre-order should go live.');
        const s = new Date(start);
        const en = end ? new Date(end) : null;
        if (en && en <= s) return setError('The end time must be after the start time.');
        if (en && en <= new Date()) return setError('The end time must be in the future.');

        onSave({
            product_id: product.id,
            schedule_start: s.toISOString(),
            schedule_end: en ? en.toISOString() : null,
            schedule_enabled: enabled,
        });
    };

    return (
        <div className={styles.overlay} onClick={saving ? undefined : onClose}>
            <form className={`${styles.modal} ${styles.modalNarrow}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className={styles.modalHead}>
                    <div>
                        <h3>Schedule pre-order</h3>
                        <p>{product.title}</p>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}><FiPlay /> Go live at</label>
                    <input
                        type="datetime-local"
                        className={styles.input}
                        value={start}
                        onChange={(e) => { setStart(e.target.value); setError(''); }}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}><FiPause /> Switch off at <span className={styles.optional}>(optional)</span></label>
                    <input
                        type="datetime-local"
                        className={styles.input}
                        value={end}
                        min={start || undefined}
                        onChange={(e) => { setEnd(e.target.value); setError(''); }}
                    />
                    <small className={styles.hint}>Leave empty to keep it live until you pause it yourself.</small>
                </div>

                <label className={`${styles.tick} ${enabled ? styles.tickOn : ''}`}>
                    <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                    <span className={styles.tickBox}>{enabled && <FiCheck />}</span>
                    <span className={styles.tickText}>
                        Schedule is active
                        <small>
                            {enabled
                                ? 'The pre-order switches on and off by itself at these times.'
                                : 'Schedule is paused. Nothing changes automatically until you turn it on.'}
                        </small>
                    </span>
                </label>

                {error && <div className={`${styles.error} ${styles.errorGap}`}><FiAlertCircle /> {error}</div>}

                <div className={`${styles.modalActions} ${styles.actionsSpread}`}>
                    {hasSchedule ? (
                        <button type="button" className={styles.linkDanger} onClick={() => onClear(product.id)} disabled={saving}>
                            Remove schedule
                        </button>
                    ) : <span />}
                    <div className={styles.actionsGroup}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
                        <button type="submit" className={styles.primaryBtn} disabled={saving}>
                            {saving ? 'Saving…' : 'Save schedule'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* DELETE MODAL (reason, minimum 20 words)                             */
/* ------------------------------------------------------------------ */

const DeleteModal = ({ items, saving, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    const words = countWords(reason);
    const enough = words >= MIN_REASON_WORDS;

    const submit = (e) => {
        e.preventDefault();
        if (!enough) return;
        onConfirm(items.map((p) => p.id), reason.trim());
    };

    return (
        <div className={styles.overlay} onClick={saving ? undefined : onClose}>
            <form className={`${styles.modal} ${styles.modalNarrow}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
                <div className={styles.modalHead}>
                    <div>
                        <h3>Remove from pre-order</h3>
                        <p>{items.length === 1 ? items[0].title : `${items.length} products`}</p>
                    </div>
                    <button type="button" className={styles.closeBtn} onClick={onClose} disabled={saving} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                <div className={styles.warnBox}>
                    <FiAlertCircle />
                    <span>The pre-order is switched off, not erased. Your reason is saved with it.</span>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Reason for removing</label>
                    <textarea
                        className={styles.textarea}
                        rows={5}
                        value={reason}
                        placeholder="Explain why this pre-order is being removed (minimum 20 words)…"
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <small className={`${styles.counter} ${enough ? styles.counterOk : ''}`}>
                        {words} / {MIN_REASON_WORDS} words minimum
                    </small>
                </div>

                <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
                    <button type="submit" className={styles.dangerBtn} disabled={!enough || saving}>
                        {saving ? 'Removing…' : 'Remove pre-order'}
                    </button>
                </div>
            </form>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */

const PreOrder = ({
    auth,
    session,
    addNotification,
    products,
    setProducts,
    preorders,
    setPreorders
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [preLoading, setPreLoading] = useState(false); // pre-order details are loading

    const [selected, setSelected] = useState(new Set());
    const [priceFilter, setPriceFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalIds, setModalIds] = useState(null);       // add / edit
    const [scheduleId, setScheduleId] = useState(null);   // schedule modal
    const [deleteIds, setDeleteIds] = useState(null);     // delete modal
    const [saving, setSaving] = useState(false);
    const [busyIds, setBusyIds] = useState(new Set());

    const preMap = useMemo(() => new Map(preorders.map((r) => [r.product_id, r])), [preorders]);

    const notifyError = (err, fallback) =>
        addNotification({ h2: 'Error occurred', desc: err?.message || fallback });

    // 2) one call for every product that already has can_preorder === true.
    //    The page is already visible; only those cards show a small Wait until this finishes.
    const fetchPreorders = async (list) => {
        const ids = list.filter((p) => p.can_preorder === true).map((p) => p.id);
        if (!ids.length) return;

        setPreLoading(true);
        try {
            setPreorders(await api.getPreorderInfo(auth, session, ids));
        } catch (err) {
            console.error('preorder info error:', err);
            notifyError(err, 'Could not load pre-order details.');
        } finally {
            setPreLoading(false);
        }
    };

    const load = async () => {
        setIsLoading(true);
        let list = [];
        try {
            // 1) products
            list = await api.getProducts(auth, session);
            setProducts(list);
        } catch (err) {
            console.error('load error:', err);
            notifyError(err, 'Could not load products. Please try again.');
        } finally {
            setIsLoading(false);
        }
        await fetchPreorders(list);
    };

    useEffect(() => {
        if (products.length === 0) {
            load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const visible = useMemo(() => {
        const range = PRICE_RANGES.find((r) => r.value === priceFilter);
        return products.filter((p) => {
            const pre = preMap.get(p.id);
            const inPre = p.can_preorder === true;
            const statusOk =
                statusFilter === 'all' ||
                (statusFilter === 'available' && !inPre) ||
                (statusFilter === 'preorder' && inPre) ||
                (statusFilter === 'tentative' && inPre && !!pre && !pre.confirmed_date);
            return statusOk && range.test(priceOf(p));
        });
    }, [products, preMap, priceFilter, statusFilter]);

    // products already in pre-order (can_preorder: true) can't be selected
    const selectable = visible.filter((p) => p.can_preorder !== true);
    const selectedVisible = selectable.filter((p) => selected.has(p.id));
    const allSelected = selectable.length > 0 && selectedVisible.length === selectable.length;
    const filtersActive = priceFilter !== 'all' || statusFilter !== 'all';
    const preCount = products.filter((p) => p.can_preorder === true).length;
    const tentativeCount = preorders.filter((r) => !r.confirmed_date).length;

    const toggleAll = () =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) selectable.forEach((p) => next.delete(p.id));
            else selectable.forEach((p) => next.add(p.id));
            return next;
        });

    const toggleOne = (id) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const clearFilters = () => {
        setPriceFilter('all');
        setStatusFilter('all');
    };

    const markBusy = (ids, on) =>
        setBusyIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
            return next;
        });

    // put a row returned by the server back into the list
    const replaceRow = (row) =>
        setPreorders((prev) => {
            const exists = prev.some((r) => r.product_id === row.product_id);
            return exists ? prev.map((r) => (r.product_id === row.product_id ? row : r)) : [...prev, row];
        });

    /* ---------- add + edit ---------- */
    const handleSave = async (rows) => {
        setSaving(true);
        try {
            const isEdit = rows.length === 1 && preMap.has(rows[0].product_id);

            if (isEdit) {
                const row = await api.updatePreorder(auth, session, rows[0]);
                replaceRow(row);
                setModalIds(null);
                addNotification({ h2: 'Success', desc: 'Pre-order updated.' });
                return;
            }

            const saved = await api.savePreorders(auth, session, rows);
            const ids = saved.map((r) => r.product_id);

            setPreorders((prev) => [...prev.filter((r) => !ids.includes(r.product_id)), ...saved]);
            setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, can_preorder: true } : p)));
            setSelected((prev) => {
                const next = new Set(prev);
                ids.forEach((id) => next.delete(id));
                return next;
            });
            setModalIds(null);
            addNotification({
                h2: 'Success',
                desc: `${saved.length} product${saved.length > 1 ? 's' : ''} saved to pre-order.`,
            });
        } catch (err) {
            console.error('save error:', err);
            notifyError(err, 'Could not save pre-order. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /* ---------- live / paused ---------- */
    const handleToggleStatus = async (id, status) => {
        markBusy([id], true);
        try {
            replaceRow(await api.setStatus(auth, session, id, status));
            addNotification({ h2: 'Success', desc: status ? 'Pre-order is live.' : 'Pre-order paused.' });
        } catch (err) {
            console.error('toggle error:', err);
            notifyError(err, 'Could not update status.');
        } finally {
            markBusy([id], false);
        }
    };

    /* ---------- schedule ---------- */
    const handleScheduleSave = async (payload) => {
        setSaving(true);
        try {
            replaceRow(await api.setSchedule(auth, session, payload));
            setScheduleId(null);
            addNotification({ h2: 'Success', desc: 'Schedule saved.' });
        } catch (err) {
            console.error('schedule error:', err);
            notifyError(err, 'Could not save the schedule.');
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleClear = async (id) => {
        setSaving(true);
        try {
            replaceRow(await api.setSchedule(auth, session, { product_id: id, clear: true }));
            setScheduleId(null);
            addNotification({ h2: 'Success', desc: 'Schedule removed.' });
        } catch (err) {
            console.error('schedule clear error:', err);
            notifyError(err, 'Could not remove the schedule.');
        } finally {
            setSaving(false);
        }
    };

    // pause / resume the schedule without changing its times
    const handleScheduleToggle = async (id, enabled) => {
        markBusy([id], true);
        try {
            replaceRow(await api.setSchedule(auth, session, { product_id: id, schedule_enabled: enabled }));
            addNotification({ h2: 'Success', desc: enabled ? 'Schedule resumed.' : 'Schedule paused.' });
        } catch (err) {
            console.error('schedule toggle error:', err);
            notifyError(err, 'Could not update the schedule.');
        } finally {
            markBusy([id], false);
        }
    };

    /* ---------- delete (status false + reason) ---------- */
    const handleDelete = async (ids, reason) => {
        setSaving(true);
        markBusy(ids, true);
        try {
            await api.removePreorders(auth, session, ids, reason);
            setPreorders((prev) => prev.filter((r) => !ids.includes(r.product_id)));
            setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, can_preorder: false } : p)));
            setDeleteIds(null);
            addNotification({ h2: 'Success', desc: 'Removed from pre-order. The reason was saved.' });
        } catch (err) {
            console.error('delete error:', err);
            notifyError(err, 'Could not remove pre-order.');
        } finally {
            markBusy(ids, false);
            setSaving(false);
        }
    };

    const modalItems = modalIds ? products.filter((p) => modalIds.includes(p.id)) : [];
    const scheduleProduct = scheduleId ? products.find((p) => p.id === scheduleId) : null;
    const deleteItems = deleteIds ? products.filter((p) => deleteIds.includes(p.id)) : [];

    return (
        <div className={styles.wrap}>
            <div className={styles.topBar}>
                <h2 className={styles.pageTitle}><FiPackage /> Pre-orders</h2>
                <p className={styles.pageSub}>
                    Let customers pre-order out-of-stock products with a restock date and an optional prepaid offer.
                </p>
            </div>

            {isLoading ? (
                <Wait />
            ) : (
                <>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconRed}`}><FiPackage /></span>
                            <div>
                                <span className={styles.statLabel}>Out of stock</span>
                                <strong className={styles.statValue}>{products.length}</strong>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconIndigo}`}><FiCheckCircle /></span>
                            <div>
                                <span className={styles.statLabel}>In pre-order</span>
                                <strong className={styles.statValue}>{preCount}</strong>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statIcon} ${styles.iconAmber}`}><FiClock /></span>
                            <div>
                                <span className={styles.statLabel}>Tentative dates</span>
                                <strong className={styles.statValue}>{preLoading ? '…' : tentativeCount}</strong>
                            </div>
                        </div>
                    </div>

                    <div className={styles.toolbar}>
                        <button
                            className={`${styles.selectAll} ${allSelected ? styles.selectAllOn : ''}`}
                            onClick={toggleAll}
                            disabled={selectable.length === 0}
                        >
                            <span className={styles.box}>{allSelected && <FiCheck />}</span>
                            Select all
                            <span className={styles.countPill}>{selectable.length}</span>
                        </button>

                        <div className={styles.filters}>
                            <span className={styles.filterIcon}><FiFilter /></span>
                            <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                {STATUS_FILTERS.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <select className={styles.select} value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                                {PRICE_RANGES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            {filtersActive && (
                                <button className={styles.clearBtn} onClick={clearFilters}><FiX /> Clear</button>
                            )}
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiInbox className={styles.emptyIcon} />
                            <p>
                                {products.length === 0
                                    ? 'No out-of-stock products right now.'
                                    : 'No products match these filters.'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {visible.map((p) => {
                                const pre = p.can_preorder === true ? preMap.get(p.id) : null;
                                const isSelected = selected.has(p.id);
                                const isBusy = busyIds.has(p.id);
                                const price = priceOf(p);

                                // everything below comes from the pre-order details API
                                const finalRate = pre ? Number(pre.final_rate ?? price) : null;
                                const payNow = pre ? Math.round(finalRate * (Number(pre.preorder_percentage) / 100) * 100) / 100 : null;
                                const left = pre ? daysLeft(pre.restock_date) : null;
                                const sched = pre ? scheduleInfo(pre) : null;
                                const waiting = !!pre && pre.schedule_enabled && pre.schedule_state === 'waiting';
                                const statusLabel = pre ? (pre.status ? 'Live' : waiting ? 'Scheduled' : 'Paused') : '';

                                return (
                                    <div
                                        key={p.id}
                                        className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isBusy ? styles.cardSending : ''}`}
                                    >
                                        <div className={styles.imageWrap}>
                                            <img src={p.image} alt={p.title} loading="lazy" />
                                            {/* no tick for products that are already pre-order */}
                                            {p.can_preorder !== true && (
                                                <button
                                                    className={`${styles.check} ${isSelected ? styles.checkOn : ''}`}
                                                    onClick={() => toggleOne(p.id)}
                                                    aria-label={`Select ${p.title}`}
                                                >
                                                    {isSelected && <FiCheck />}
                                                </button>
                                            )}
                                            <span className={styles.stockPill}>Out of stock</span>
                                        </div>

                                        <div className={styles.body}>
                                            <h3 className={styles.productTitle}>{p.title}</h3>
                                            <span className={styles.sku}>{p.sku}</span>

                                            <div className={styles.metaRow}>
                                                <div>
                                                    <span className={styles.metaLabel}>Current price</span>
                                                    <strong className={styles.price}>{inr.format(price)}</strong>
                                                </div>
                                                {pre && Number(pre.preorder_discount) > 0 && (
                                                    <div className={styles.metaRight}>
                                                        <span className={styles.metaLabel}>Prepaid price</span>
                                                        <strong className={`${styles.price} ${styles.accent}`}>
                                                            {inr.format(finalRate)}
                                                            <em className={styles.badge}>-{pre.preorder_discount}%</em>
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>

                                            {pre ? (
                                                <>
                                                    <div className={styles.infoBox}>
                                                        <div className={styles.infoLine}>
                                                            <span className={styles.dateChip}><FiCalendar /> {fmtDate(pre.restock_date)}</span>
                                                            <span className={pre.confirmed_date ? styles.pillOk : styles.pillWarn}>
                                                                {pre.confirmed_date ? 'Confirmed' : 'May change'}
                                                            </span>
                                                        </div>
                                                        <div className={styles.infoLine}>
                                                            <span className={styles.muted}>
                                                                {left > 0 ? `${left} day${left > 1 ? 's' : ''} to restock` : 'Restock due'}
                                                            </span>
                                                            <span className={styles.muted}><FiBox /> Restock qty: {pre.stock_count ?? 0}</span>
                                                        </div>
                                                        <div className={styles.infoLine}>
                                                            <span className={styles.muted}><FiTag /> Pay now ({pre.preorder_percentage}%)</span>
                                                            <strong>{inr.format(payNow)}</strong>
                                                        </div>

                                                        {/* schedule */}
                                                        <div className={styles.schedBox}>
                                                            <div className={styles.infoLine}>
                                                                <span className={styles.muted}><FiClock /> Schedule</span>
                                                                {sched ? (
                                                                    <span className={styles.schedRight}>
                                                                        <span className={styles[sched.cls]}>{sched.label}</span>
                                                                        {sched.state !== 'ended' && (
                                                                            <button
                                                                                className={styles.miniBtn}
                                                                                onClick={() => handleScheduleToggle(p.id, !pre.schedule_enabled)}
                                                                                disabled={isBusy}
                                                                                title={pre.schedule_enabled ? 'Pause schedule' : 'Resume schedule'}
                                                                                aria-label={pre.schedule_enabled ? 'Pause schedule' : 'Resume schedule'}
                                                                            >
                                                                                {pre.schedule_enabled ? <FiPause /> : <FiPlay />}
                                                                            </button>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className={styles.muted}>Not set</span>
                                                                )}
                                                            </div>
                                                            {sched && <span className={styles.schedRange}>{sched.range}</span>}
                                                        </div>
                                                    </div>

                                                    <div className={styles.cardActions}>
                                                        <button
                                                            className={pre.status ? styles.switchOn : styles.switchOff}
                                                            onClick={() => handleToggleStatus(p.id, !pre.status)}
                                                            disabled={isBusy}
                                                            aria-label="Toggle pre-order live"
                                                            title={statusLabel}
                                                        >
                                                            <i />
                                                        </button>
                                                        <span className={styles.switchText}>{statusLabel}</span>
                                                        <button className={styles.iconBtn} onClick={() => setScheduleId(p.id)} disabled={isBusy} title="Schedule">
                                                            <FiClock />
                                                        </button>
                                                        <button className={styles.iconBtn} onClick={() => setModalIds([p.id])} disabled={isBusy} title="Edit">
                                                            <FiEdit2 />
                                                        </button>
                                                        <button className={`${styles.iconBtn} ${styles.iconDanger}`} onClick={() => setDeleteIds([p.id])} disabled={isBusy} title="Remove">
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : p.can_preorder === true ? (
                                                // already a pre-order product: never show "Add to pre-order"
                                                preLoading ? (
                                                    <div className={styles.waitBox}>
                                                        <Wait />
                                                    </div>
                                                ) : (
                                                    <div className={styles.failBox}>
                                                        <span>Pre-order details could not be loaded.</span>
                                                        <button className={styles.cancelBtn} onClick={() => fetchPreorders(products)}>
                                                            Retry
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button className={styles.addBtn} onClick={() => setModalIds([p.id])}>
                                                    <FiPlus /> Add to pre-order
                                                </button>
                                            )}
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
                                <span>Same date and offer apply to all</span>
                            </div>
                            <div className={styles.actionBtns}>
                                <button className={styles.cancelBtn} onClick={() => setSelected(new Set())}>Clear</button>
                                <button
                                    className={styles.sendAllBtn}
                                    disabled={preLoading}
                                    onClick={() => setModalIds(selectedVisible.map((p) => p.id))}
                                >
                                    <FiPlus /> Pre-order {selectedVisible.length}
                                </button>
                            </div>
                        </div>
                    )}

                    {modalIds && modalItems.length > 0 && (
                        <PreorderModal
                            key={modalIds.join('-')}
                            items={modalItems}
                            existingMap={preMap}
                            saving={saving}
                            onClose={() => setModalIds(null)}
                            onSave={handleSave}
                        />
                    )}

                    {scheduleProduct && (
                        <ScheduleModal
                            key={`sch-${scheduleProduct.id}`}
                            product={scheduleProduct}
                            pre={preMap.get(scheduleProduct.id)}
                            saving={saving}
                            onClose={() => setScheduleId(null)}
                            onSave={handleScheduleSave}
                            onClear={handleScheduleClear}
                        />
                    )}

                    {deleteIds && deleteItems.length > 0 && (
                        <DeleteModal
                            key={`del-${deleteIds.join('-')}`}
                            items={deleteItems}
                            saving={saving}
                            onClose={() => setDeleteIds(null)}
                            onConfirm={handleDelete}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default PreOrder;