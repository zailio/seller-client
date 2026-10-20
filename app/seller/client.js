'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import FullPageLoading from '../../components/FullPageLoading';

import Head from 'next/head';
import styles from './main.module.css';
import { FaSolarPanel, FaFirstOrder, FaBox, FaRegMoneyBillAlt } from "react-icons/fa";
import { MdDashboard, MdMenu, MdOutlineInventory2 } from "react-icons/md";
import { CiUser } from "react-icons/ci";
import { AiFillProduct } from "react-icons/ai";
import { IoChatbubbleEllipsesOutline, IoClose, IoAdd, IoLogoStackoverflow } from "react-icons/io5";
import { IoIosPricetags } from "react-icons/io";
import { BsGraphUp } from "react-icons/bs";
import { FaShop } from "react-icons/fa6";
import { FiLayout } from "react-icons/fi";

import { useStore } from '../../context/store';
import { useSearchParams, useRouter } from "next/navigation";

import Dashboard from './components/dashbord';
import DeliveryWarehousePage from './components/delivery';
import ProductManagement from './components/manage';
import InventorySellerPage from './inventory/main';
import SalesManage from './sales/main';
import CouponManage from './coupon/main';
import SellerProfileEdit from './components/profile';
import ChatInterface from './components/chat';
import ProductAnalytics from './components/analytics';
import Uploadproduct from './upload/main';
import SellerBusinessLocations from './components/shop';
import OrderManagement from './order/main';
import EstimatedProduct from './components/estimation';
import StorefrontStudio from './storefront/Studio';

import Messages from '../../components/messages';
import Alert from '../../components/alert';

import { useWebSocket } from '../../context/ws';
import config from '../../utils/config';


const SellerDashbord = ({ result }) => {
    const searchParams = useSearchParams();
    const { send, socket, isConnected } = useWebSocket();
    const router = useRouter();
    const { addNotification, genAlert, setTopLineLoad } = useStore();
    const [fullPageLoading, setFullPageLoading] = useState(false);
    const [menu, setMenu] = useState(false);
    const [shift, setShift] = useState(1);
    const [sellerId, setSellerId] = useState('');
    const [sellerInfo, setSellerInfo] = useState(result?.data?.data || false);
    const [session, setSession] = useState(result?.data?.session_id);
    const [errors, setErrors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // warehouse
    const [warehouse, setWareHouse] = useState(result?.data?.warehouse);
    // dashboard
    const [totalOrders, setTotalOrders] = useState(false);
    const [cancelledOrders, setCancelledOrders] = useState(false);
    const [pendingOrders, setPendingOrders] = useState(false);
    const [completedOrders, setCompletedOrders] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(false);
    const [aov, setAov] = useState(false);
    const [totalProducts, setTotalProducts] = useState(false);
    const [activeProducts, setActiveProducts] = useState(false);
    const [inactiveProducts, setInactiveProducts] = useState(false);
    const [totalCustomers, setTotalCustomers] = useState(false);
    const [customerReviews, setCustomerReviews] = useState(false);
    const [chatDelay, setChatDelay] = useState(false);

    // coupon
    const [coupons, setCoupons] = useState([]);
    // invetory
    const [inventory, setInventory] = useState([]);
    // sales
    const [sales, setSales] = useState([]);

    // manage
    const [initialProducts, setInitialProducts] = useState(false);
    const [totalPages, setTotalPages] = useState({
        all: 1,
        active: 0,
        inactive: 0
    });
    const [paginatedProducts, setPaginatedProducts] = useState([]);

    // order
    const [orderOverall, setOrderOverall] = useState(false);

    // store
    const [store, setStore] = useState(result?.data?.store || false);

    useEffect(() => {
        const orderId = searchParams.get("order_id");
        if (!orderId) return;
        const id = sessionStorage.getItem("delivery_id");
        if (id == orderId) {
            addNotification({
                h2: "succsuss",
                desc: "Payment succsuss. Please refresh the page.",
            });
            sessionStorage.removeItem("delivery_id");
        };
    }, [searchParams]);

    useEffect(() => {
        // Not signed in -> send the seller to the main login page
        if (!result?.auth) {
            setTopLineLoad(true);
        }
    }, [result?.auth]);

    const runShift = (i) => {
        setMenu(false);
        setShift(i);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors(false);

        try {

            if (!result.auth) {
                setErrors('Authentication required. Please log in again.');
                setTopLineLoad(true);
                return;
            }

            const response = await fetch(`${config.SERVER_URL}/seller/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${result.auth}`,
                },
                body: JSON.stringify({ seller_id: sellerId }),
            });

            if (!response.ok) {
                throw new Error(`Auth service unavailable (${response.status})`);
            }

            const data = await response.json();

            if (data?.data?.status) {
                // Save seller-token cookie client-side
                const onRootDomain = window.location.hostname.endsWith(config.domain);
                await Cookies.set('seller-token', data.data.session_id, {
                    ...(onRootDomain ? { domain: `.${config.domain}` } : {}),
                    path: '/',
                    expires: 1 / 8, // 3 hours
                    secure: window.location.protocol === 'https:',
                    sameSite: 'Lax',
                });

                setSession(data.data.session_id);
                setWareHouse(data.data.warehouse);
                setStore(data.data.store);
            } else {
                setErrors(data?.data?.message || data?.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            setErrors('Authentication failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // chats
    const [rooms, setRooms] = useState(false);
    const [chats, setChats] = useState({});
    const [currentRoom, setCurrentRoom] = useState(false);
    const [onUpdate, setUpdate] = useState(false);

    // profile
    const [formData, setFormData] = useState({
        icon: "https://via.placeholder.com/150",
        username: 'N/A',
        sub_dom: 'N/A',
        number: "N/A",
        email: "N/A",
        createdAt: new Date()
    });

    useEffect(() => {
        if (!isConnected) return;
        socket.onmessage = (creds) => {
            const { event, data } = JSON.parse(creds.data);
            if (event === 'chat_response') {
                if (data.status) {
                    setUpdate(prev => prev + 1);
                    setChats(a => {
                        return {
                            ...a,
                            [data.chat_id]: {
                                ...a[data.chat_id],
                                today: [...(a[data.chat_id]?.today || []),
                                { text: data.message, type: "received", time: data.time, seen: 0 }]
                            },
                        };
                    });
                };
            };
        };
    }, [isConnected, socket, currentRoom]);

    return (
        <div className={styles.body}>
            <Head>
                <title>Seller Dashboard</title>
            </Head>
            <Messages />
            <Alert />
            {
                !session ?
                    <div className={styles.auth}>
                        <div className={styles.authContainer}>
                            <h2 className={styles.title}>Seller Authentication</h2>
                            <form onSubmit={handleSubmit} className={styles.authForm}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="sellerId" className={styles.label}>
                                        Seller ID
                                    </label>
                                    <input
                                        type="text"
                                        id="sellerId"
                                        value={sellerId}
                                        onChange={(e) => setSellerId(e.target.value)}
                                        className={styles.input}
                                        placeholder="Enter your Seller ID"
                                        disabled={isSubmitting}
                                        required
                                    />
                                    {errors && <div className={styles.errorMessage}>{errors}</div>}
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Authenticating...' : 'Authenticate'}
                                </button>
                            </form>
                        </div>
                    </div> :
                    <>
                        {!menu && <header className={styles.mb}>
                            <MdMenu size={23} onClick={(e) => {
                                e.stopPropagation();
                                setMenu(true)
                            }} />
                            <h2>Menu</h2>
                        </header>}
                        <div className={styles.dashboard}>
                            <div className={styles.sidebar} style={{
                                display: menu ? 'block' : ''
                            }}>
                                <div className={styles.sidebar_header}>
                                    <h3>
                                        <FaSolarPanel size={25} />
                                        Seller Dashboard
                                        <IoClose size={25} className={styles.menu_close} onClick={() => setMenu(false)} />
                                    </h3>
                                </div>
                                <div className={styles.sidebar_menu}>
                                    <ul>
                                        <li className={shift === 1 ? styles.active : ''} onClick={() => runShift(1)}>
                                            <MdDashboard size={22} />
                                            Dashboard
                                        </li>
                                        <li className={shift === 2 ? styles.active : ''} onClick={() => runShift(2)}>
                                            <FaBox size={22} />
                                            Delivery Partner
                                        </li>
                                        <li className={shift === 3 ? styles.active : ''} onClick={() => runShift(3)}>
                                            <IoAdd size={22} />
                                            Upload | Update
                                        </li>
                                        <li className={shift === 4 ? styles.active : ''} onClick={() => runShift(4)}>
                                            <MdOutlineInventory2 size={22} />
                                            Inventory
                                        </li>
                                        <li className={shift === 5 ? styles.active : ''} onClick={() => runShift(5)}>
                                            <FaRegMoneyBillAlt size={22} />
                                            Sales
                                        </li>
                                        <li className={shift === 6 ? styles.active : ''} onClick={() => runShift(6)}>
                                            <AiFillProduct size={22} />
                                            Manage Products
                                        </li>
                                        <li className={shift === 7 ? styles.active : ''} onClick={() => runShift(7)}>
                                            <IoIosPricetags size={22} />
                                            Coupons
                                        </li>
                                        <li className={shift === 8 ? styles.active : ''} onClick={() => runShift(8)}>
                                            <FaFirstOrder size={22} />
                                            Orders
                                        </li>
                                        <li className={shift === 9 ? styles.active : ''} onClick={() => runShift(9)}>
                                            <IoLogoStackoverflow size={22} />
                                            Estimated Profit
                                        </li>
                                        <li className={shift === 10 ? styles.active : ''} onClick={() => runShift(10)}>
                                            <IoChatbubbleEllipsesOutline size={22} />
                                            Chats
                                        </li>
                                        <li className={shift === 11 ? styles.active : ''} onClick={() => runShift(11)}>
                                            <FaShop size={22} />
                                            Shop
                                        </li>
                                        <li className={shift === 14 ? styles.active : ''} onClick={() => runShift(14)}>
                                            <FiLayout size={22} />
                                            Storefront Studio
                                        </li>
                                        <li className={shift === 12 ? styles.active : ''} onClick={() => runShift(12)}>
                                            <BsGraphUp size={22} />
                                            Analytics
                                        </li>
                                        <li className={shift === 13 ? styles.active : ''} onClick={() => runShift(13)}>
                                            <CiUser size={22} />
                                            Seller Profile
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className={styles.main_content}>
                                {
                                    shift === 1 ? (
                                        <Dashboard
                                            auth={result.auth}
                                            session={session}
                                            sellerInfo={sellerInfo}
                                            totalOrders={totalOrders}
                                            cancelledOrders={cancelledOrders}
                                            pendingOrders={pendingOrders}
                                            completedOrders={completedOrders}
                                            totalRevenue={totalRevenue}
                                            aov={aov}
                                            totalProducts={totalProducts}
                                            activeProducts={activeProducts}
                                            inactiveProducts={inactiveProducts}
                                            totalCustomers={totalCustomers}
                                            customerReviews={customerReviews}
                                            chatDelay={chatDelay}
                                            setTotalOrders={setTotalOrders}
                                            setCancelledOrders={setCancelledOrders}
                                            setPendingOrders={setPendingOrders}
                                            setCompletedOrders={setCompletedOrders}
                                            setTotalRevenue={setTotalRevenue}
                                            setAov={setAov}
                                            setTotalProducts={setTotalProducts}
                                            setActiveProducts={setActiveProducts}
                                            setInactiveProducts={setInactiveProducts}
                                            setTotalCustomers={setTotalCustomers}
                                            setCustomerReviews={setCustomerReviews}
                                            setChatDelay={setChatDelay}
                                            setSellerInfo={setSellerInfo}
                                        />
                                    ) : shift === 2 ? (
                                        <DeliveryWarehousePage
                                            addNotification={addNotification}
                                            auth={result.auth}
                                            session={session}
                                            warehouse={warehouse}
                                            setWareHouse={setWareHouse}
                                        />
                                    ) : shift === 3 ? (
                                        <Uploadproduct
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            genAlert={genAlert}
                                            setFullPageLoading={setFullPageLoading}
                                            warehouse={warehouse}
                                        />
                                    ) : shift === 4 ? (
                                        <InventorySellerPage
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            inventory={inventory}
                                            setInventory={setInventory}
                                        />
                                    ) : shift === 5 ? (
                                        <SalesManage
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            sales={sales}
                                            setSales={setSales}
                                        />
                                    ) : shift === 6 ? (
                                        <ProductManagement
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            initialProducts={initialProducts}
                                            setInitialProducts={setInitialProducts}
                                            totalPages={totalPages}
                                            setTotalPages={setTotalPages}
                                            paginatedProducts={paginatedProducts}
                                            setPaginatedProducts={setPaginatedProducts}
                                        />
                                    ) : shift === 7 ? (
                                        <CouponManage
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            coupons={coupons}
                                            setCoupons={setCoupons}
                                        />
                                    ) : shift === 8 ? (
                                        <OrderManagement
                                            addNotification={addNotification}
                                            auth={result.auth}
                                            session={session}
                                            overall={orderOverall}
                                            setOverall={setOrderOverall}
                                            warehouse={warehouse}
                                        />
                                    ) : shift === 9 ? (
                                        <EstimatedProduct
                                            addNotification={addNotification}
                                            auth={result.auth}
                                            session={session}
                                            setFullPageLoading={setFullPageLoading}
                                        />
                                    ) : shift === 10 ? (
                                        <ChatInterface
                                            auth={result.auth}
                                            session={session}
                                            send={send}
                                            socket={socket}
                                            isConnected={isConnected}
                                            rooms={rooms}
                                            setRooms={setRooms}
                                            chats={chats}
                                            setChats={setChats}
                                            currentRoom={currentRoom}
                                            setCurrentRoom={setCurrentRoom}
                                            onUpdate={onUpdate}
                                            setUpdate={setUpdate}
                                        />
                                    ) : shift === 11 ? (
                                        <SellerBusinessLocations
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            genAlert={genAlert}
                                            store={store}
                                            setStore={setStore}
                                            setFullPageLoading={setFullPageLoading}
                                        />
                                    ) : shift === 14 ? (
                                        <StorefrontStudio
                                            auth={result.auth}
                                            session={session}
                                            store={store}
                                            addNotification={addNotification}
                                        />
                                    ) : shift === 12 ? (
                                        <ProductAnalytics
                                            auth={result.auth}
                                            session={session}
                                        />
                                    ) : (
                                        <SellerProfileEdit
                                            auth={result.auth}
                                            session={session}
                                            addNotification={addNotification}
                                            genAlert={genAlert}
                                            formData={formData}
                                            setFormData={setFormData}
                                        />
                                    )
                                }
                            </div>
                        </div>
                    </>
            }
            {fullPageLoading && <FullPageLoading />}
        </div>
    );
};

export default SellerDashbord;