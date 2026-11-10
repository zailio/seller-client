'use client';

// The dashboard frame shared by the seller, brand and distributor apps: sign-in form,
// sidebar, top bar with notifications, and the screens every role has (app/_shared).
// Each role passes its own menu (`nav`) and its role-only screens (`renderRoleView`).
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';
import { FaSolarPanel } from 'react-icons/fa';
import { MdMenu } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';

import styles from './shell.module.css';
import { ITEMS } from './items';
import { ROLES, isRole, dashboardUrl } from './roles';
import NotificationBell from './NotificationBell';

import FullPageLoading from '../../components/FullPageLoading';
import Messages from '../../components/messages';
import Alert from '../../components/alert';
import { useStore } from '../../context/store';
import { useWebSocket } from '../../context/ws';
import config from '../../utils/config';

import Settlements from '../_shared/settlements/main';
import DeliveryWarehousePage from '../_shared/components/delivery';
import InventorySellerPage from '../_shared/inventory/main';
import SalesManage from '../_shared/sales/main';
import CouponManage from '../_shared/coupon/main';
import SellerProfileEdit from '../_shared/components/profile';
import ChatInterface from '../_shared/components/chat';
import ProductAnalytics from '../_shared/components/analytics';
import Uploadproduct from '../_shared/upload/main';
import SellerBusinessLocations from '../_shared/components/shop';
import AbandonedCartsPage from '../_shared/abandoned/main';
import OrderManagement from '../_shared/order/main';
import PreorderModal from '../_shared/preorder/main';
import EstimatedProduct from '../_shared/components/estimation';
import StorefrontStudio from '../_shared/storefront/Studio';
import SupportCenter from '../_shared/support/main';
import ProductsHub from '../_shared/products/ProductsHub';
import EventOffers from '../_shared/event-offers/main';

export default function DashboardShell({ result, role, nav, renderRoleView }) {
    const meta = ROLES[role];
    const searchParams = useSearchParams();
    const { send, socket, isConnected } = useWebSocket();
    const { addNotification, genAlert, setTopLineLoad } = useStore();

    const [fullPageLoading, setFullPageLoading] = useState(false);
    const [menu, setMenu] = useState(false);
    const [view, setView] = useState(nav[0]);
    const [productsTab, setProductsTab] = useState('products');
    const [editSku, setEditSku] = useState('');
    const [sellerId, setSellerId] = useState('');
    const [sellerInfo, setSellerInfo] = useState(result?.data?.data || false);
    const [session, setSession] = useState(result?.data?.session_id);
    const [accountRole, setAccountRole] = useState(isRole(result?.data?.account_type) ? result.data.account_type : 'seller');
    const [errors, setErrors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [warehouse, setWareHouse] = useState(result?.data?.warehouse);
    const [store, setStore] = useState(result?.data?.store || false);

    // Per-screen caches, kept here so switching screens does not refetch everything.
    const [coupons, setCoupons] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [sales, setSales] = useState([]);
    const [preOrderProducts, setPreOrderProducts] = useState([]);
    const [preorders, setPreorders] = useState([]);
    const [orderOverall, setOrderOverall] = useState(false);
    const [ABcarts, setABCarts] = useState([]);
    const [rooms, setRooms] = useState(false);
    const [chats, setChats] = useState({});
    const [currentRoom, setCurrentRoom] = useState(false);
    const [onUpdate, setUpdate] = useState(false);
    const [formData, setFormData] = useState({
        icon: 'https://via.placeholder.com/150',
        username: 'N/A',
        sub_dom: 'N/A',
        number: 'N/A',
        email: 'N/A',
        createdAt: new Date(),
    });
    // Seller home (existing dashboard) metrics cache.
    const [homeMetrics, setHomeMetrics] = useState({});

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        if (!orderId) return;
        const id = sessionStorage.getItem('delivery_id');
        if (id == orderId) {
            addNotification({ h2: 'succsuss', desc: 'Payment succsuss. Please refresh the page.' });
            sessionStorage.removeItem('delivery_id');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    useEffect(() => {
        // Not signed in -> send to the main login page
        if (!result?.auth) setTopLineLoad(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result?.auth]);

    useEffect(() => {
        if (!isConnected) return;
        socket.onmessage = (creds) => {
            const { event, data } = JSON.parse(creds.data);
            if (event === 'chat_response' && data.status) {
                setUpdate((prev) => prev + 1);
                setChats((a) => ({
                    ...a,
                    [data.chat_id]: {
                        ...a[data.chat_id],
                        today: [...(a[data.chat_id]?.today || []), { text: data.message, type: 'received', time: data.time, seen: 0 }],
                    },
                }));
            }
        };
    }, [isConnected, socket, currentRoom]);

    const runShift = (key) => {
        setMenu(false);
        setView(key);
    };

    // Used by the notification bell, overview tiles and product actions.
    // 'feedback:questions' → Products & Feedback on the Questions tab, etc.
    const navigate = (target) => {
        if (!target) return;
        const [key, sub] = String(target).split(':');
        if (key === 'feedback') {
            setProductsTab(sub || 'comments');
            runShift('products');
            return;
        }
        if (key === 'products') setProductsTab('products');
        if (nav.includes(key)) runShift(key);
    };

    const editProduct = (sku) => {
        setEditSku(sku);
        runShift('upload');
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${result.auth}` },
                body: JSON.stringify({ seller_id: sellerId }),
            });
            if (!response.ok) throw new Error(`Auth service unavailable (${response.status})`);
            const data = await response.json();
            if (data?.data?.status) {
                const onRootDomain = window.location.hostname.endsWith(config.domain);
                await Cookies.set('seller-token', data.data.session_id, {
                    ...(onRootDomain ? { domain: `.${config.domain}` } : {}),
                    path: '/',
                    expires: 1 / 8, // 3 hours
                    secure: window.location.protocol === 'https:',
                    sameSite: 'Lax',
                });
                setSession(data.data.session_id);
                setAccountRole(isRole(data.data.account_type) ? data.data.account_type : 'seller');
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

    // Everything a screen may need.
    const ctx = {
        role,
        auth: result?.auth,
        session,
        addNotification,
        genAlert,
        setFullPageLoading,
        navigate,
        editProduct,
        sellerInfo,
        setSellerInfo,
        homeMetrics,
        setHomeMetrics,
    };
    const common = { auth: result?.auth, session, addNotification };

    // Screens shared by every role (app/_shared).
    const renderSharedView = (key) => {
        switch (key) {
            case 'settlements':
                return <Settlements {...common} warehouse={warehouse} setWareHouse={setWareHouse} />;
            case 'delivery':
                return <DeliveryWarehousePage {...common} warehouse={warehouse} setWareHouse={setWareHouse} />;
            case 'upload':
                return (
                    <Uploadproduct
                        {...common}
                        genAlert={genAlert}
                        setFullPageLoading={setFullPageLoading}
                        warehouse={warehouse}
                        initialSku={editSku}
                        onInitialSkuUsed={() => setEditSku('')}
                    />
                );
            case 'inventory':
                return <InventorySellerPage {...common} inventory={inventory} setInventory={setInventory} />;
            case 'sales':
                return <SalesManage {...common} sales={sales} setSales={setSales} />;
            case 'products':
                return <ProductsHub {...common} role={role} initialTab={productsTab} onEditProduct={editProduct} />;
            case 'coupons':
                return <CouponManage {...common} coupons={coupons} setCoupons={setCoupons} />;
            case 'event-offers':
                return <EventOffers {...common} />;
            case 'abandoned':
                return <AbandonedCartsPage {...common} carts={ABcarts} setCarts={setABCarts} />;
            case 'orders':
                return <OrderManagement {...common} overall={orderOverall} setOverall={setOrderOverall} warehouse={warehouse} />;
            case 'preorders':
                return <PreorderModal {...common} products={preOrderProducts} setProducts={setPreOrderProducts} preorders={preorders} setPreorders={setPreorders} />;
            case 'estimation':
                return <EstimatedProduct {...common} setFullPageLoading={setFullPageLoading} />;
            case 'chats':
                return (
                    <ChatInterface
                        auth={result?.auth}
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
                );
            case 'shop':
                return <SellerBusinessLocations {...common} genAlert={genAlert} store={store} setStore={setStore} setFullPageLoading={setFullPageLoading} />;
            case 'storefront':
                return <StorefrontStudio {...common} store={store} />;
            case 'analytics':
                return <ProductAnalytics auth={result?.auth} session={session} />;
            case 'profile':
                return <SellerProfileEdit {...common} genAlert={genAlert} formData={formData} setFormData={setFormData} />;
            default:
                return <SupportCenter {...common} genAlert={genAlert} formData={formData} setFormData={setFormData} />;
        }
    };

    const renderView = () => (renderRoleView && renderRoleView(view, ctx)) || renderSharedView(view);

    // Signed in, but this account belongs to another dashboard (e.g. a brand account on
    // seller.uniyel.com). The server would refuse role-only actions anyway; send it home.
    if (session && accountRole !== role) {
        const target = ROLES[accountRole];
        return (
            <div className={styles.body}>
                <div className={styles.wrongRole}>
                    <h2>This is a {target.label.toLowerCase()} account</h2>
                    <p>You are on the {meta.label.toLowerCase()} dashboard. Your account uses the {target.title.toLowerCase()}.</p>
                    <a href={dashboardUrl(accountRole)}>Open {target.title}</a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.body}>
            <Messages />
            <Alert />
            {!session ? (
                <div className={styles.auth}>
                    <div className={styles.authContainer}>
                        <h2 className={styles.title}>{meta.label} Authentication</h2>
                        <form onSubmit={handleSubmit} className={styles.authForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="sellerId" className={styles.label}>{meta.label} ID</label>
                                <input
                                    type="text"
                                    id="sellerId"
                                    value={sellerId}
                                    onChange={(e) => setSellerId(e.target.value)}
                                    className={styles.input}
                                    placeholder={`Enter your ${meta.label} ID`}
                                    disabled={isSubmitting}
                                    required
                                />
                                {errors && <div className={styles.errorMessage}>{errors}</div>}
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                {isSubmitting ? 'Authenticating...' : 'Authenticate'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <>
                    {!menu && (
                        <header className={styles.mb}>
                            <MdMenu size={23} onClick={(e) => { e.stopPropagation(); setMenu(true); }} />
                            <h2>Menu</h2>
                            <div style={{ marginLeft: 'auto' }}>
                                <NotificationBell auth={result.auth} session={session} onNavigate={navigate} />
                            </div>
                        </header>
                    )}
                    <div className={styles.dashboard}>
                        <div className={styles.sidebar} style={{ display: menu ? 'block' : '' }}>
                            <div className={styles.sidebar_header}>
                                <h3>
                                    <FaSolarPanel size={25} />
                                    {meta.title}
                                    <IoClose size={25} className={styles.menu_close} onClick={() => setMenu(false)} />
                                </h3>
                            </div>
                            <div className={styles.sidebar_menu}>
                                <ul>
                                    {nav.map((key) => {
                                        const item = ITEMS[key];
                                        const Icon = item.icon;
                                        return (
                                            <li key={key} className={view === key ? styles.active : ''} onClick={() => runShift(key)}>
                                                <Icon size={22} color={item.color} />
                                                {item.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                        <div className={styles.main_content}>
                            <div className={styles.topbar}>
                                <span className={styles.topbarTitle}>{ITEMS[view]?.label}</span>
                                <span className={styles.roleChip}>{meta.label}</span>
                                <NotificationBell auth={result.auth} session={session} onNavigate={navigate} />
                            </div>
                            {renderView()}
                        </div>
                    </div>
                </>
            )}
            {fullPageLoading && <FullPageLoading />}
        </div>
    );
}
