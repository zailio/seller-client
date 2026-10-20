import Seller from './client';
import { cookies } from "next/headers";
import config from '../../utils/config';


async function serverData() {
  const cookie = await cookies();
  const seller_id = cookie.get('seller-token')?.value || null;
  const auth = cookie.get('AUTH-T')?.value || null;
  // Local preview without a backend: NEXT_PUBLIC_DEMO=1
  if (config.demo) return demoSession();
  try {
    if (!auth || !seller_id) return {
      status: false,
      auth: auth
    };
    const res = await fetch(config.SERVER_URL + '/seller/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`

      },
      body: JSON.stringify({ session_id: seller_id }),
    });
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    };
    const result = await res.json();
    return { ...result, auth };
  } catch (e) {
    console.log(e);
    return {
      status: false,
      auth: auth
    };
  };
}

function demoSession() {
  return {
    status: true,
    auth: 'demo-auth',
    data: {
      status: true,
      session_id: 'demo-session',
      data: { name: 'Demo Seller' },
      warehouse: false,
      store: { name: 'Aurora Home & Living', sub_dom: 'aurora', bio: 'Hand-picked home essentials, delivered across India.', icon: '' },
    },
  };
}

export default async function App() {
  const response = await serverData();

  return <Seller result={response} />;
};