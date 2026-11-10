'use client';

import DashboardShell from '../_dashboard/Shell';
import { SELLER_NAV } from './nav';
import SellerHome from './Home';

// Seller-only screens; everything else comes from app/_shared through the shell.
function renderSellerView(view, ctx) {
    if (view === 'dashboard') return <SellerHome ctx={ctx} />;
    return null;
}

export default function SellerApp({ result }) {
    return <DashboardShell result={result} role="seller" nav={SELLER_NAV} renderRoleView={renderSellerView} />;
}
