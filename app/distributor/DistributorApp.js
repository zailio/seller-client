'use client';

import DashboardShell from '../_dashboard/Shell';
import { DISTRIBUTOR_NAV } from './nav';
import DistributorOverview from './Overview';
import MyBrands from './MyBrands';

// Distributor-only screens; everything else comes from app/_shared through the shell.
function renderDistributorView(view, ctx) {
    const common = { auth: ctx.auth, session: ctx.session, addNotification: ctx.addNotification };
    switch (view) {
        case 'overview': return <DistributorOverview {...common} onNavigate={ctx.navigate} />;
        case 'brands': return <MyBrands {...common} />;
        default: return null;
    }
}

export default function DistributorApp({ result }) {
    return <DashboardShell result={result} role="brand_distributor" nav={DISTRIBUTOR_NAV} renderRoleView={renderDistributorView} />;
}
