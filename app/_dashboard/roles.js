// The three business dashboards served by this one project.
//
//   seller.uniyel.com             → app/seller       (account_type 'seller')
//   brand.uniyel.com              → app/brand        (account_type 'brand')
//   distributor.uniyel.com        → app/distributor  (account_type 'brand_distributor')
//   brand-distributor.uniyel.com  → app/distributor  (alias)
//
// proxy.js uses SUBDOMAIN_TO_PATH to route a subdomain to its folder. On localhost (no
// subdomain) open /seller, /brand or /distributor directly; "/" opens /seller.
//
// The role itself always comes from the server (sellers.account_type). These values
// only decide which dashboard is shown; every API enforces the role again.
import config from '../../utils/config';

export const ROLES = Object.freeze({
    seller: { role: 'seller', path: '/seller', subdomains: ['seller'], title: 'Seller Dashboard', label: 'Seller' },
    brand: { role: 'brand', path: '/brand', subdomains: ['brand'], title: 'Brand Dashboard', label: 'Brand' },
    brand_distributor: {
        role: 'brand_distributor', path: '/distributor', subdomains: ['distributor', 'brand-distributor'],
        title: 'Distributor Dashboard', label: 'Distributor',
    },
});

export const ROLE_KEYS = Object.keys(ROLES);
export const isRole = (value) => ROLE_KEYS.includes(value);

export const SUBDOMAIN_TO_PATH = Object.freeze(
    Object.fromEntries(Object.values(ROLES).flatMap((r) => r.subdomains.map((sub) => [sub, r.path]))),
);
export const ROLE_PATHS = Object.values(ROLES).map((r) => r.path);

// Where an account of `role` should go. On the real domain that is its own subdomain;
// anywhere else (localhost, previews) the path inside this project.
export function dashboardUrl(role) {
    const meta = ROLES[role] || ROLES.seller;
    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;
        if (hostname === config.domain || hostname.endsWith(`.${config.domain}`)) {
            return `${protocol}//${meta.subdomains[0]}.${config.domain}${port ? `:${port}` : ''}/`;
        }
    }
    return meta.path;
}
