// Server-side session for every dashboard page: reads the shared cookies and asks the
// backend who this account is (including its permanent account_type).
import { cookies } from 'next/headers';
import config from '../../utils/config';

export async function loadSession() {
    const cookie = await cookies();
    const session_id = cookie.get('seller-token')?.value || null;
    const auth = cookie.get('AUTH-T')?.value || null;
    // Local preview without a backend: NEXT_PUBLIC_DEMO=1
    if (config.demo) return demoSession();
    try {
        if (!auth || !session_id) return { status: false, auth };
        const res = await fetch(`${config.SERVER_URL}/seller/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
            body: JSON.stringify({ session_id }),
            cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        const result = await res.json();
        return { ...result, auth };
    } catch (e) {
        console.log(e);
        return { status: false, auth };
    }
}

function demoSession() {
    return {
        status: true,
        auth: 'demo-auth',
        data: {
            status: true,
            session_id: 'demo-session',
            account_type: 'seller',
            data: { name: 'Demo Seller' },
            warehouse: false,
            store: { name: 'Aurora Home & Living', sub_dom: 'aurora', bio: 'Hand-picked home essentials, delivered across India.', icon: '' },
        },
    };
}
