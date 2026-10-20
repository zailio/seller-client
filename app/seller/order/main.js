'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './order.module.css';
import config from '../../../utils/config';
import Wait from '../../../components/wait';

import PopUp from './sub/popUp';
import Reason from './sub/cancel';
import Overall from './sub/overall';
import Options from './sub/options';
import PendingOrders from './sub/pending';
import ConfirmedOrders from './sub/confirmed';
import PickupOrders from './sub/pickup';
import ProcessingOrders from './sub/processing';
import CompletedOrders from './sub/completed';
import CancelledOrders from './sub/cancelledTable';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';


const EMPTY_CACHE = {
    pending: false,
    confirmed: false,
    pickup: false,
    processing: false,
    completed: false,
    uc: false,
    sc: false
};

const OrderManagement = ({ auth, session, addNotification, overall, setOverall, warehouse }) => {
    const [showResone, setShowResone] = useState(false);
    const [reshowReason, setReshowReason] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    // one slot per tab: false = needs (re)fetch, array = loaded data
    const [ordersCache, setOrdersCache] = useState(EMPTY_CACHE);

    const [sortOption, setSortOption] = useState('latest');
    const [filter, setFilter] = useState(false);
    const [openMenus, setOpenMenus] = useState({});
    const [showSomething, setShowSomeThing] = useState(false);
    const [showData, setShowData] = useState({});

    const getOrderMetrics = useCallback(async () => {
        try {
            const res = await fetch(config.SERVER_URL + '/seller/order-metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
                body: JSON.stringify({ session_id: session }),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) setOverall(result.data.data);
            else throw new Error('error');
        } catch (e) {
            console.log(e);
        }
    }, [auth, session, setOverall]);

    // fetches one tab's data regardless of which tab is currently active
    const fetchTab = useCallback(async (tab) => {
        try {
            let url = config.SERVER_URL;
            const body = { session_id: session };
            if (tab === 'pending') {
                url += '/seller/list-pending';
            } else if (tab === 'confirmed') {
                url += '/seller/list-confirmed-order';
            } else if (tab === 'pickup') {
                url += '/seller/list-pickup';
            } else if (tab === 'processing') {
                url += '/seller/list-processing';
            } else if (tab === 'completed') {
                url += '/seller/completed-list';
            } else if (tab === 'sc') {
                url += '/seller/seller-cancelled';
            } else {
                url += '/seller/list-order';
                body.method = tab;
            }
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`Error: ${res.statusText}`);
            const result = await res.json();
            if (result.data.status) {
                console.log('fetched', tab, result.data.data);
                setOrdersCache(prev => ({ ...prev, [tab]: result.data.data }));
            } else throw new Error('error');
        } catch (e) {
            console.log(e);
            // leave the slot as false so the tab retries on next visit
        }
    }, [auth, session]);

    // Called by child components right after a mutating action succeeds
    // (confirm / cancel / dispatch). Drops the order from its old tab
    // immediately, and marks the destination tab as needing a fresh fetch —
    // this is what fixes tabs showing stale rows after switching away.
    const handleOrderMoved = useCallback((orderId, fromTab, toTab) => {
        setOrdersCache(prev => {
            const next = { ...prev };
            if (Array.isArray(next[fromTab])) {
                next[fromTab] = next[fromTab].filter(o => o.id !== orderId);
            }
            if (toTab) next[toTab] = false;
            return next;
        });
        getOrderMetrics();
    }, [getOrderMetrics]);

    useEffect(() => {
        if (!overall) getOrderMetrics();
        fetchTab('pending');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (ordersCache[activeTab] === false) fetchTab(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (!showSomething) return;
        const current = { ...showData };
        if (!current[showSomething.type]) current[showSomething.type] = {};
        if (!current[showSomething.type][showSomething.id]) {
            const currentList = ordersCache[activeTab] || [];
            const currentTab = currentList.find(a => a.id === showSomething.id);
            if (!currentTab) return;
            if (showSomething.type === 'customer') {
                current[showSomething.type][showSomething.id] = {
                    name: { customer: currentTab.customer },
                    address: currentTab.address
                };
            } else if (showSomething.type === 'full-timeline') {
                current[showSomething.type][showSomething.id] = {
                    updates: currentTab.updates
                };
            } else if (showSomething.type === 'price') {
                current[showSomething.type][showSomething.id] = {
                    price: {
                        amount: currentTab.amount,
                        quantity: currentTab.items,
                        "payment type": currentTab.payment_type,
                        coupon: currentTab.coupon
                    },
                };
                if (Array.isArray(currentTab.used_combo) && currentTab.used_combo.length) {
                    current[showSomething.type][showSomething.id].tableData = {
                        mainHead: 'used compo',
                        head: [
                            { label: 'quantity', span: 1 },
                            { label: 'per unit', span: 1 },
                            { label: 'total', span: 1 }
                        ],
                        value: currentTab.used_combo.map(d => [d.quantity, d.perUnit, d.total])
                    };
                }
                current[showSomething.type][showSomething.id]['Net total'] = { total: currentTab.listedPrice };
            } else if (showSomething.type === 'full-detiles') {
                current[showSomething.type][showSomething.id] = {
                    productData: currentTab.product,
                    name: { customer: currentTab.customer },
                    address: currentTab.address,
                    'basic details': {
                        orderID: `#${currentTab.id}`,
                        date: new Date(currentTab.date).toLocaleDateString('en-US', config.time_option)
                    },
                    'basic info': { color: currentTab.color, size: currentTab.size },
                    price: {
                        amount: currentTab.amount,
                        quantity: currentTab.items,
                        "payment type": currentTab.payment_type,
                        coupon: currentTab.coupon
                    },
                };
                if (Array.isArray(currentTab.used_combo) && currentTab.used_combo.length) {
                    current[showSomething.type][showSomething.id].tableData = {
                        mainHead: 'used compo',
                        head: [
                            { label: 'quantity', span: 1 },
                            { label: 'per unit', span: 1 },
                            { label: 'total', span: 1 }
                        ],
                        value: currentTab.used_combo.map(d => [d.quantity, d.perUnit, d.total])
                    };
                }
                current[showSomething.type][showSomething.id]['Net total'] = { total: currentTab.listedPrice };
            }
            setShowData(current);
        }
    }, [showSomething]);

    const toggleMenu = (productId) => {
        setOpenMenus(prev => ({ [productId]: !prev[productId] }));
    };

    const activeData = ordersCache[activeTab];

    return (
        <div style={{ position: 'relative' }}>
            {reshowReason && <div className='oveflowBg'>
                <div className={styles.align}>
                    <textarea readOnly rows={7} className={styles.textArea} value={reshowReason} />
                    <button onClick={() => setReshowReason(false)} className={styles.submitBtn}>close</button>
                </div>
            </div>}
            {showResone && <div className='oveflowBg'>
                <Reason
                    close={() => setShowResone(false)}
                    auth={auth}
                    session={session}
                    addNotification={addNotification}
                    order_id={showResone}
                    toggleMenu={toggleMenu}
                    onCancelled={(orderId) => handleOrderMoved(orderId, activeTab, 'sc')}
                />
            </div>}
            <div className={styles.container}>
                {showSomething && <PopUp showSomething={showSomething} setShowSomeThing={setShowSomeThing} showData={showData} />}
                <header className={styles.header}>
                    <h1 className={styles.title}>Order Management</h1>
                    <div className={styles.searchBar}>
                        <input type="text" placeholder="Search orders..." />
                        <button>Search</button>
                    </div>
                </header>

                <Overall overall={overall} />
                <div className={styles.filterSortContainer}>
                    <Options activeTab={activeTab} setActiveTab={setActiveTab} />
                    <div className={styles.sortOptions}>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className={styles.sortSelect}>
                            <option value="all">All</option>
                            <option value="latest">Latest Orders</option>
                            <option value="oldest">Oldest Orders</option>
                            <option value="prepaid">Prepaid Orders</option>
                            <option value="COD">COD Orders</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="price-low">Price: Low to High</option>
                        </select>
                    </div>
                </div>
                {
                    activeData === false
                        ? <Wait />
                        : <div className={styles.tableContainer}>
                            {
                                activeTab === 'pending' ?
                                    <PendingOrders
                                        pending={activeData}
                                        openMenus={openMenus}
                                        toggleMenu={toggleMenu}
                                        activeTab={activeTab}
                                        setShowSomeThing={setShowSomeThing}
                                        setShowResone={setShowResone}
                                        session={session}
                                        auth={auth}
                                        onOrderMoved={handleOrderMoved}
                                    />
                                    : activeTab === 'confirmed' ?
                                        <ConfirmedOrders
                                            openMenus={openMenus}
                                            toggleMenu={toggleMenu}
                                            activeTab={activeTab}
                                            setShowSomeThing={setShowSomeThing}
                                            setShowResone={setShowResone}
                                            session={session}
                                            auth={auth}
                                            confirmed={activeData}
                                            loading={false}
                                            warehouse={warehouse}
                                            addNotification={addNotification}
                                            onOrderMoved={handleOrderMoved}
                                        />
                                        : activeTab === 'pickup' ?
                                            <PickupOrders
                                                openMenus={openMenus}
                                                toggleMenu={toggleMenu}
                                                activeTab={activeTab}
                                                setShowSomeThing={setShowSomeThing}
                                                setShowResone={setShowResone}
                                                session={session}
                                                auth={auth}
                                                pickup={activeData}
                                                loading={false}
                                                addNotification={addNotification}
                                                warehouse={warehouse}
                                                onOrderMoved={handleOrderMoved}
                                            />
                                            : activeTab === 'processing' ?
                                                <ProcessingOrders
                                                    processing={activeData}
                                                    setShowSomeThing={setShowSomeThing}
                                                    addNotification={addNotification}
                                                />
                                                : activeTab === 'completed' ?
                                                    <CompletedOrders
                                                        data={activeData}
                                                        setShowSomeThing={setShowSomeThing}
                                                        session={session}
                                                        auth={auth}
                                                        addNotification={addNotification}
                                                    />
                                                    : (activeTab === 'sc' || activeTab === 'uc') ?
                                                        <CancelledOrders
                                                            data={activeData}
                                                            activeTab={activeTab}
                                                            setReason={setReshowReason}
                                                            session={session}
                                                            auth={auth}
                                                            addNotification={addNotification}
                                                            isSellerCancelled={activeTab === 'sc'}
                                                        />
                                                        : <table className={styles.productTable}>
                                                            <tbody className={styles.tableBody}>
                                                                <tr className={styles.tableRow}>
                                                                    <td colSpan={6} className={styles.noResultsCell}>No products found matching your criteria</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                            }
                        </div>
                }
            </div>
        </div>
    );
};

export default OrderManagement;