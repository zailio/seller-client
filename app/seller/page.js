// seller.uniyel.com (and /seller on localhost)
import SellerApp from './SellerApp';
import { loadSession } from '../_dashboard/session';

export const metadata = { title: 'Seller Dashboard' };

export default async function SellerPage() {
    return <SellerApp result={await loadSession()} />;
}
