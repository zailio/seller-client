// Display helpers shared by the business dashboard screens.

export const rupees = (n, { decimals = 0 } = {}) => {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
    const value = Number(n);
    const abs = Math.abs(value).toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals || 2,
    });
    return `${value < 0 ? '−' : ''}₹${abs}`;
};

export const compactRupees = (n) => {
    const v = Number(n || 0);
    const abs = Math.abs(v);
    const sign = v < 0 ? '−' : '';
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}k`;
    return `${sign}₹${Math.round(abs)}`;
};

export const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export const timeAgo = (d) => {
    if (!d) return '';
    const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return 'just now';
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.round(h / 24);
    if (days < 30) return `${days}d ago`;
    return shortDate(d);
};

export const PROFIT_STATUS = {
    final: { label: 'Final', tone: 'success' },
    estimated: { label: 'Estimated', tone: 'warning' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
    not_recorded: { label: 'Not recorded', tone: 'neutral' },
};

export const ORDER_STATUS = {
    pending: { label: 'Pending', tone: 'warning' },
    confirmed: { label: 'Confirmed', tone: 'info' },
    pickup: { label: 'Pickup', tone: 'info' },
    processing: { label: 'In transit', tone: 'info' },
    completed: { label: 'Delivered', tone: 'success' },
    sc: { label: 'Cancelled by you', tone: 'danger' },
    uc: { label: 'Cancelled by buyer', tone: 'danger' },
    rto: { label: 'RTO', tone: 'danger' },
};

export const orderStatus = (status, visible) => ORDER_STATUS[status] || { label: visible || status || '—', tone: 'neutral' };

// Brand ↔ distributor request status (brand Distributors page, distributor My Brands page).
export const LINK_STATUS = {
    pending: { label: 'Pending', tone: 'warning' },
    approved: { label: 'Approved', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'danger' },
    revoked: { label: 'Revoked', tone: 'neutral' },
};
