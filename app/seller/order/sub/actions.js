'use client';
import { useState } from 'react';
import styles from './css/moreAction.module.css';
import config from '../../../../utils/config';

import { ImSpinner2 } from 'react-icons/im';
import { BiMessageSquareDetail } from "react-icons/bi";
import { FaGears } from "react-icons/fa6";
import { FaRegEye, FaBan } from 'react-icons/fa';

const MoreActions = ({
    activeTab,
    setShowSomeThing,
    order,
    session,
    auth,
    setShowResone,
    onOrderMoved,
    toggleMenu
}) => {
    const [loading, setLoading] = useState(false);

    async function setConfirmedOrder(id) {
        setLoading('confirm');
        try {
            const res = await fetch(config.SERVER_URL + '/seller/update-order-to-confirmed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
                body: JSON.stringify({ session_id: session, order_id: id }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                onOrderMoved?.(id, 'pending', 'confirmed');
                toggleMenu?.(id);
            } else throw new Error('error');
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.moreActionsMenu}>
            <button className={styles.moreActionsOption} onClick={() => setShowSomeThing({ type: 'full-detiles', id: order.id })}>
                <FaRegEye className={styles.moreActionsIcon} /> view full details
            </button>
            <button className={styles.moreActionsOption} onClick={() => { }}>
                <BiMessageSquareDetail className={styles.moreActionsIcon} /> message them
            </button>
            {
                activeTab === 'pending' ? (
                    <button className={styles.moreActionsOption} onClick={() => setConfirmedOrder(order.id)} disabled={!!loading}>
                        {loading === 'confirm'
                            ? <span className={styles.flexBtn}><ImSpinner2 size={20} className={styles.spin} /><span>processing</span></span>
                            : <><FaGears className={styles.moreActionsIcon} /><span>set order as confirmed</span></>}
                    </button>
                ) : activeTab === 'confirmed' ? (
                    <button className={styles.moreActionsOption} onClick={() => { }} disabled={!!loading}>
                        <FaGears className={styles.moreActionsIcon} />
                        <span>set order as processing</span>
                    </button>
                ) : null
            }
            <button className={styles.moreActionsOption} onClick={() => setShowResone(order.id)}>
                <FaBan className={styles.moreActionsIcon} /> cancel order
            </button>
        </div>
    );
};

export default MoreActions;