'use client';

// Seller home: the existing seller dashboard, with the "needs attention" strip above it.
// Its numbers are cached in the shell (ctx.homeMetrics) so returning here does not refetch.
import Dashboard from '../_shared/components/dashbord';
import SellerAttentionStrip from './AttentionStrip';

const METRICS = [
    'totalOrders', 'cancelledOrders', 'pendingOrders', 'completedOrders', 'totalRevenue', 'aov',
    'totalProducts', 'activeProducts', 'inactiveProducts', 'totalCustomers', 'customerReviews', 'chatDelay',
];

export default function SellerHome({ ctx }) {
    const { homeMetrics, setHomeMetrics } = ctx;
    const props = {};
    for (const name of METRICS) {
        props[name] = homeMetrics[name] ?? false;
        props[`set${name[0].toUpperCase()}${name.slice(1)}`] = (value) => setHomeMetrics((prev) => ({
            ...prev,
            [name]: typeof value === 'function' ? value(prev[name] ?? false) : value,
        }));
    }
    return (
        <>
            <SellerAttentionStrip auth={ctx.auth} session={ctx.session} onNavigate={ctx.navigate} />
            <Dashboard
                auth={ctx.auth}
                session={ctx.session}
                sellerInfo={ctx.sellerInfo}
                setSellerInfo={ctx.setSellerInfo}
                {...props}
            />
        </>
    );
}
