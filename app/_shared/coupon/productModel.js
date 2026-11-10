'use client';

import { useEffect, useState } from 'react';
import { FiPackage } from 'react-icons/fi';
import styles from './coupon.module.css';
import Wait from '../../../components/wait';
import ProductRestriction from './productRestriction';
import config from '../../../utils/config';

const CouponProductsModal = ({ auth, session, coupon, onClose, onSaved, addNotification }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [value, setValue] = useState({ mode: 'none', ids: [], products: {} });

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

    useEffect(() => {
        const init = async () => {
            const mode = coupon.allowed_product_ids?.length
                ? 'allow'
                : coupon.non_allowed_product_ids?.length ? 'disallow' : 'none';
            const ids = mode === 'allow'
                ? coupon.allowed_product_ids
                : mode === 'disallow' ? coupon.non_allowed_product_ids : [];

            if (!ids.length) {
                setValue({ mode: 'none', ids: [], products: {} });
                setLoading(false);
                return;
            }

            try {
                const data = await callApi('products-by-ids', { product_ids: ids });
                const products = {};
                (data.products || []).forEach((p) => { products[p.id] = p; });
                setValue({ mode, ids, products });
            } catch (err) {
                console.error('load coupon products error:', err);
                addNotification({ h2: 'Error occurred', desc: err.message || 'Could not load existing products. Please try again.' });
            } finally {
                setLoading(false);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await callApi('update-coupon-products', {
                coupon_id: coupon.id,
                mode: value.mode,
                product_ids: value.ids
            });
            const patch = value.mode === 'allow'
                ? { allowed_product_ids: value.ids, non_allowed_product_ids: [] }
                : value.mode === 'disallow'
                    ? { allowed_product_ids: [], non_allowed_product_ids: value.ids }
                    : { allowed_product_ids: [], non_allowed_product_ids: [] };
            onSaved(coupon.id, patch);
            addNotification({ h2: 'Success', desc: 'Product access updated successfully.' });
        } catch (err) {
            console.error('save coupon products error:', err);
            addNotification({ h2: 'Error occurred', desc: err.message || 'Could not save product access. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={() => !saving && onClose()}>
            <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}><FiPackage /> Manage products — {coupon.code}</h3>
                <p className={styles.modalSubtitle}>Choose which products this coupon allows or blocks.</p>

                {loading ? (
                    <Wait />
                ) : (
                    <ProductRestriction
                        auth={auth}
                        session={session}
                        value={value}
                        onChange={setValue}
                        minimumAmount={coupon.minimum_amount ?? ''}
                        minimumProfit={coupon.minimum_profit ?? ''}
                        addNotification={addNotification}
                    />
                )}

                <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} disabled={saving} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} disabled={saving || loading} onClick={save}>
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CouponProductsModal;