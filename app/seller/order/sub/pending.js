'use client';

import styles from './css/pending.module.css';
import Wait from '../../../../components/wait';
import MoreActions from './actions';
import { MdArrowRight } from "react-icons/md";
import { FaEllipsisV, FaInfoCircle, FaBoxOpen } from 'react-icons/fa';

const formatMoney = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

const PendingOrders = ({
    toggleMenu,
    pending,
    openMenus,
    activeTab,
    setShowSomeThing,
    setShowResone,
    session,
    auth,
    addNotification,
    onOrderMoved
}) => {
    if (pending === false) return <Wait />;

    if (!pending.length) {
        return (
            <div className={styles.emptyState}>
                <FaBoxOpen className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No pending orders</p>
                <p className={styles.emptyBody}>New orders will show up here as they come in.</p>
            </div>
        );
    }

    return (
        <div className={styles.tableScroll}>
            <table className={styles.table}>
                <thead className={styles.tableHead}>
                    <tr>
                        <th className={styles.headCell}>Order</th>
                        <th className={styles.headCell}>Customer</th>
                        <th className={styles.headCell}>Price</th>
                        <th className={styles.headCell}>Payment Type</th>
                        <th className={styles.headCell}>Delivery charge</th>
                        <th className={styles.headCell}>
                            <span>Collected fee</span>
                            <button
                                type="button"
                                className={styles.infoTrigger}
                                onClick={() => addNotification?.({
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
                    {pending.map(order => (
                        <tr key={order.id} className={styles.row}>
                            <td className={styles.cell}>
                                <div className={styles.productCell}>
                                    <img
                                        src={order.product.image}
                                        alt={order.product.title}
                                        className={styles.productImage}
                                    />
                                    <div>
                                        <div className={styles.orderIdLabel}>#{order.id}</div>
                                        <div className={styles.productName}>{order.product.title}</div>
                                        {order.date && (
                                            <div className={styles.orderDate}>
                                                {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td className={styles.cell}>
                                <div className={styles.stackedInfo}>
                                    <span className={styles.primaryLine}>{order.address.fullName}</span>
                                    <span className={styles.secondaryLine}>{order.address.phone}</span>
                                </div>
                                <button
                                    className={styles.linkBtn}
                                    onClick={() => setShowSomeThing({ type: 'customer', id: order.id })}
                                >
                                    Details <MdArrowRight />
                                </button>
                            </td>

                            <td className={styles.cell}>
                                <div className={styles.stackedInfo}>
                                    <span className={styles.money}>{formatMoney(order.amount)}</span>
                                    <span className={styles.secondaryLine}>{order.items} item{order.items === 1 ? '' : 's'}</span>
                                </div>
                                <button
                                    className={styles.linkBtn}
                                    onClick={() => setShowSomeThing({ type: 'price', id: order.id })}
                                >
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
                                    {openMenus[order.id] &&
                                        (activeTab === 'pending' || activeTab === 'confirmed') && (
                                            <MoreActions
                                                activeTab={activeTab}
                                                setShowSomeThing={setShowSomeThing}
                                                order={order}
                                                session={session}
                                                auth={auth}
                                                setShowResone={setShowResone}
                                                onOrderMoved={onOrderMoved}
                                                toggleMenu={toggleMenu}
                                            />
                                        )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PendingOrders;