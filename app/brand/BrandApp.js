'use client';

import DashboardShell from '../_dashboard/Shell';
import { BRAND_NAV } from './nav';
import BrandOverview from './Overview';
import BrandSales from './BrandSales';
import Distributors from './Distributors';

// Brand-only screens; everything else comes from app/_shared through the shell.
function renderBrandView(view, ctx) {
    const common = { auth: ctx.auth, session: ctx.session, addNotification: ctx.addNotification };
    switch (view) {
        case 'overview': return <BrandOverview {...common} onNavigate={ctx.navigate} />;
        case 'brand-sales': return <BrandSales {...common} />;
        case 'distributors': return <Distributors {...common} />;
        default: return null;
    }
}

export default function BrandApp({ result }) {
    return <DashboardShell result={result} role="brand" nav={BRAND_NAV} renderRoleView={renderBrandView} />;
}
