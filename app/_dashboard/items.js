// Every menu item a dashboard can show. Each role picks and orders its own list in its
// folder (app/seller/nav.js, app/brand/nav.js, app/distributor/nav.js).
import { FaFirstOrder, FaBox, FaRegMoneyBillAlt, FaCalendarCheck } from 'react-icons/fa';
import { MdDashboard, MdOutlineInventory2, MdFreeCancellation, MdOutlineSupportAgent } from 'react-icons/md';
import { CiUser } from 'react-icons/ci';
import { AiFillProduct } from 'react-icons/ai';
import { IoChatbubbleEllipsesOutline, IoAdd, IoLogoStackoverflow } from 'react-icons/io5';
import { IoIosPricetags } from 'react-icons/io';
import { BsGraphUp } from 'react-icons/bs';
import { FaShop, FaMoneyBills } from 'react-icons/fa6';
import { FiLayout, FiGift, FiUsers, FiTrendingUp } from 'react-icons/fi';

export const ITEMS = Object.freeze({
    // role-specific
    dashboard: { label: 'Dashboard', icon: MdDashboard, color: '#3B82F6' },
    overview: { label: 'Overview', icon: MdDashboard, color: '#3B82F6' },
    'brand-sales': { label: 'Brand Sales', icon: FiTrendingUp, color: '#22C55E' },
    distributors: { label: 'Distributors', icon: FiUsers, color: '#A855F7' },
    brands: { label: 'My Brands', icon: FiUsers, color: '#A855F7' },
    // shared screens (app/_shared)
    orders: { label: 'Orders', icon: FaFirstOrder, color: '#0EA5E9' },
    sales: { label: 'Sales', icon: FaRegMoneyBillAlt, color: '#16A34A' },
    products: { label: 'Products & Feedback', icon: AiFillProduct, color: '#EC4899' },
    upload: { label: 'Upload | Update', icon: IoAdd, color: '#10B981' },
    inventory: { label: 'Inventory', icon: MdOutlineInventory2, color: '#F59E0B' },
    coupons: { label: 'Coupons', icon: IoIosPricetags, color: '#D946EF' },
    'event-offers': { label: 'Event Offers', icon: FiGift, color: '#F472B6' },
    settlements: { label: 'Settlements', icon: FaMoneyBills, color: '#EC4899' },
    delivery: { label: 'Delivery Partner', icon: FaBox, color: '#8B5CF6' },
    abandoned: { label: 'Abandoned Order', icon: MdFreeCancellation, color: '#EF4444' },
    preorders: { label: 'Pre Orders', icon: FaCalendarCheck, color: '#14B8A6' },
    estimation: { label: 'Estimated Profit', icon: IoLogoStackoverflow, color: '#F97316' },
    chats: { label: 'Chats', icon: IoChatbubbleEllipsesOutline, color: '#6366F1' },
    shop: { label: 'Shop', icon: FaShop, color: '#A16207' },
    storefront: { label: 'Storefront Studio', icon: FiLayout, color: '#64748B' },
    analytics: { label: 'Analytics', icon: BsGraphUp, color: '#059669' },
    profile: { label: 'Profile', icon: CiUser, color: '#DB2777' },
    support: { label: 'Support Agent', icon: MdOutlineSupportAgent, color: '#0284C7' },
});
