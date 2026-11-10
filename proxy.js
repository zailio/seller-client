import { NextResponse } from 'next/server';
import { refreshAuthCookie } from './proxy/cookie';
import { SUBDOMAIN_TO_PATH, ROLE_PATHS } from './app/_dashboard/roles';

// One project, three dashboards, chosen by subdomain:
//   seller.uniyel.com             → /seller
//   brand.uniyel.com              → /brand
//   distributor.uniyel.com        → /distributor   (brand-distributor.uniyel.com too)
// The visitor keeps seeing "/" in the address bar. Another dashboard's path on a role
// subdomain (e.g. brand.uniyel.com/seller) is sent back to that subdomain's own root.
// Without a role subdomain (localhost, previews) the paths work directly and "/" opens /seller.
// Also keeps the shared AUTH-T cookie fresh on every request.
function roleBase(host) {
    const hostname = (host || '').split(':')[0].toLowerCase();
    const sub = hostname.split('.')[0];
    return hostname.includes('.') ? SUBDOMAIN_TO_PATH[sub] || null : null;
}

export default function middleware(req) {
    const url = req.nextUrl.clone();
    const base = roleBase(req.headers.get('host'));
    const path = url.pathname;
    const otherDashboard = ROLE_PATHS.find((p) => p !== base && (path === p || path.startsWith(`${p}/`)));

    let response;
    if (base && otherDashboard) {
        url.pathname = '/';
        response = NextResponse.redirect(url);
    } else if (base && !(path === base || path.startsWith(`${base}/`))) {
        url.pathname = path === '/' ? base : `${base}${path}`;
        response = NextResponse.rewrite(url);
    } else if (!base && path === '/') {
        url.pathname = '/seller';
        response = NextResponse.rewrite(url);
    } else {
        response = NextResponse.next();
    }
    return refreshAuthCookie(req, response);
}

export const config = {
    matcher: ['/((?!_next|favicon.ico|images|icons|fonts|api).*)'],
};
