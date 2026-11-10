'use client';
import { useState } from 'react';
import styles from './css/cancelled.module.css';
import { IoMdClose } from "react-icons/io";
import { ImSpinner2 } from 'react-icons/im';
import config from '../../../../utils/config';

export default function Reason({
    close,
    session,
    auth,
    addNotification,
    order_id,
    toggleMenu
}) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const handlSubmit = async (e) => {
        e.preventDefault();
        if (!reason || reason.length < 75) {
            addNotification({
                h2: 'Error',
                desc: 'reason must be inclued 75 charecters',
                tag: 'error',
            });
            return;
        };
        toggleMenu(order_id);
        setLoading(true);
        try {
            const res = await fetch(config.SERVER_URL + '/seller/remove-cod-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${auth}`
                },
                body: JSON.stringify({
                    session_id: session,
                    reason,
                    order_id
                }),
            });
            if (!res.ok) {
                throw new Error(`Error: ${res.statusText}`);
            };
            const result = await res.json();
            if (result.data.status) {
                addNotification({
                    h2: 'Order removed!',
                    desc: 'order has been removed',
                    tag: 'error',
                });
            } else throw Error('error');
        } catch (e) {
            addNotification({
                h2: 'Error!',
                desc: 'there was a problem with your order',
                tag: 'error',
            });
            console.log(e);
        } finally {
            close();
            setLoading(false);
        };
    }


    return (
        <div className={styles.resoneDiv}>
            <div className={styles.head}>
                <h2>add your reson</h2>
                <button
                    onClick={close}
                    className={styles.closePopUp + ' ' + styles.commonTopPopUp}
                >
                    <IoMdClose size={25} />
                </button>
            </div>
            <form onSubmit={handlSubmit}>
                <textarea
                    rows={5}
                    placeholder='reason why its get rejected - prescribe well within 250 words'
                    className={styles.textArea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <button
                    type='submit'
                    className={styles.submitBtn}>
                    {
                        loading
                            ? <span className={styles.flexBtn}>
                                <ImSpinner2 size={20} className={styles.spin} />
                                <span>processing</span>
                            </span>
                            : <span>submit</span>
                    }
                </button>
            </form>
        </div>
    );
}