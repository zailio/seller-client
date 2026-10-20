'use client';

import { useState, useEffect } from 'react';
import config from '../../../utils/config';
import styles from './css/dashboard.module.css';
import { BsHandbag, BsCartCheck } from "react-icons/bs";
import { MdOutlineRemoveShoppingCart, MdOutlineMonetizationOn, MdOutlineAttachMoney } from "react-icons/md";
import { RiLuggageCartLine } from "react-icons/ri";
import { CiUser } from "react-icons/ci";
import { FaRegCommentDots } from "react-icons/fa6";
import { BiConversation } from "react-icons/bi";
import { LuPackage, LuPackageCheck, LuPackageX } from "react-icons/lu";
import Loader from '../../../components/wait';


export default function Dashboard({
    auth,
    session,
    sellerInfo,
    totalOrders,
    cancelledOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    aov,
    totalProducts,
    activeProducts,
    inactiveProducts,
    totalCustomers,
    customerReviews,
    chatDelay,
    setTotalOrders,
    setCancelledOrders,
    setPendingOrders,
    setCompletedOrders,
    setTotalRevenue,
    setAov,
    setTotalProducts,
    setActiveProducts,
    setInactiveProducts,
    setTotalCustomers,
    setCustomerReviews,
    setChatDelay
}) {

    useEffect(() => {
        if (totalOrders) return;
        let eventSource;
        // Client-side
        async function fetchData() {
            try {
                eventSource = new EventSource(`${config.SERVER_URL}/seller/dashboard?session_id=${session}&auth=${auth}`);

                eventSource.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log(data);
                };
                eventSource.addEventListener('end', (event) => {
                    const data = JSON.parse(event.data);
                    console.log('Stream completed:', data);
                    eventSource.close();
                });
                eventSource.addEventListener('response', (event) => {
                    const data = JSON.parse(event.data);
                    if (data.event === 'totalOrder') {
                        setTotalOrders(data)
                    } else if (data.event === 'pendingOrder') {
                        setPendingOrders(data)
                    } else if (data.event === 'cancelledOrder') {
                        setCancelledOrders(data)
                    } else if (data.event === 'compleatedOrder') {
                        setCompletedOrders(data)
                    } else if (data.event === 'revenue') {
                        setTotalRevenue(data)
                    } else if (data.event === 'aov') {
                        setAov(data)
                    } else if (data.event === 'totalProduct') {
                        setTotalProducts(data)
                    } else if (data.event === 'activeProduct') {
                        setActiveProducts(data)
                    } else if (data.event === 'inactiveProduct') {
                        setInactiveProducts(data)
                    } else if (data.event === 'customer') {
                        setTotalCustomers(data)
                    } else if (data.event === 'review') {
                        setCustomerReviews(data)
                    } else if (data.event === 'chatDelay') {
                        setChatDelay(data)
                    };
                });
                eventSource.onerror = () => {
                    eventSource.close();
                    if (eventSource.readyState === EventSource.CLOSED) {
                        console.log('Connection closed normally');
                    } else {
                        console.warn('Connection error - may reconnect');
                    };
                };
            } catch (e) {
                console.log(e);
            }
        }
        fetchData();
        return () => {
            if (eventSource) {
                eventSource.close();
                console.log("SSE Connection Cleaned Up");
            };
        };
    }, []);

    return (
        <div className={styles.main}>
            <div className={styles.top_bar}>
                <div className={styles.user_info}>
                    <div className={styles.user}>
                        <img src={sellerInfo && sellerInfo.img ?
                            sellerInfo.img : sellerInfo ?
                                `https://ui-avatars.com/api/?name=${sellerInfo.username}&background=3498db&color=fff` :
                                "https://ui-avatars.com/api/?name=Seller+Name&background=3498db&color=fff"
                        } alt="User" />
                        <span>{sellerInfo ? sellerInfo.username : 'Seller Name'}</span>
                    </div>
                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.stats_cards}>
                    <div className={styles.card}>
                        {totalOrders ? <>
                            <div className={`${styles.card_icon} ${styles.emgreen}`}>
                                <BsHandbag size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{totalOrders.total}</h3>
                                <p>Total Orders</p>
                                <span className={`${styles.trend} ${totalOrders.trend ? styles.up : styles.down}`}>{totalOrders.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {cancelledOrders ? <>
                            <div className={`${styles.card_icon} ${styles.pinkred}`}>
                                <MdOutlineRemoveShoppingCart size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{cancelledOrders.total}</h3>
                                <p>Cancelled Orders</p>
                                <span className={`${styles.trend} ${cancelledOrders.trend ? styles.up : styles.down}`}>{cancelledOrders.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {pendingOrders ? <>
                            <div className={`${styles.card_icon} ${styles.orange}`}>
                                <RiLuggageCartLine size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{pendingOrders.total}</h3>
                                <p>Pending Orders</p>
                                <span className={`${styles.trend} ${pendingOrders.trend ? styles.up : styles.down}`}>{pendingOrders.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {completedOrders ? <>
                            <div className={`${styles.card_icon} ${styles.freshgreen}`}>
                                <BsCartCheck size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{completedOrders.total}</h3>
                                <p>Completed Orders</p>
                                <span className={`${styles.trend} ${completedOrders.trend ? styles.up : styles.down}`}>{completedOrders.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {totalRevenue ? <>
                            <div className={`${styles.card_icon} ${styles.blue}`}>
                                <MdOutlineMonetizationOn size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>${totalRevenue.total}</h3>
                                <p>Total Revenue</p>
                                <span className={`${styles.trend} ${totalRevenue.trend ? styles.up : styles.down}`}>{totalRevenue.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {aov ? <>
                            <div className={`${styles.card_icon} ${styles.lightblue}`}>
                                <MdOutlineAttachMoney size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{aov.current}</h3>
                                <p>Average Order Amount</p>
                                <span className={`${styles.trend} ${aov.trend ? styles.up : styles.down}`}>{aov.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {totalProducts ? <>
                            <div className={`${styles.card_icon} ${styles.freshgreen}`}>
                                <LuPackage size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{totalProducts.total}</h3>
                                <p>total Products</p>
                                <span className={`${styles.trend} ${totalProducts.trend ? styles.up : styles.down}`}>{totalProducts.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {activeProducts ? <>
                            <div className={`${styles.card_icon} ${styles.emgreen}`}>
                                <LuPackageCheck size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{activeProducts.total}</h3>
                                <p>Active Products</p>
                                <span className={`${styles.trend} ${activeProducts.trend ? styles.up : styles.down}`}>{activeProducts.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {inactiveProducts ? <>
                            <div className={`${styles.card_icon} ${styles.lightblue}`}>
                                <LuPackageX size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{inactiveProducts.total}</h3>
                                <p>Inactive Products</p>
                                <span className={`${styles.trend} ${inactiveProducts.trend ? styles.up : styles.down}`}>{inactiveProducts.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {totalCustomers ? <>
                            <div className={`${styles.card_icon} ${styles.freshgreen}`}>
                                <CiUser size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{totalCustomers.total}</h3>
                                <p>total Customers</p>
                                <span className={`${styles.trend} ${totalCustomers.trend ? styles.up : styles.down}`}>{totalCustomers.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {customerReviews ? <>
                            <div className={`${styles.card_icon} ${styles.lightblue}`}>
                                <FaRegCommentDots size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{customerReviews.total}</h3>
                                <p>Customer Reviews</p>
                                <span className={`${styles.trend} ${customerReviews.trend ? styles.up : styles.down}`}>{customerReviews.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                    <div className={styles.card}>
                        {chatDelay ? <>
                            <div className={`${styles.card_icon} ${styles.freshgreen}`}>
                                <BiConversation size={25} />
                            </div>
                            <div className={styles.card_info}>
                                <h3>{chatDelay.total}</h3>
                                <p>chat Delay</p>
                                <span className={`${styles.trend} ${chatDelay.trend ? styles.up : styles.down}`}>{chatDelay.percentage}% from last month</span>
                            </div>
                        </> : <Loader />}
                    </div>
                </div>
            </div>
        </div>
    )
};