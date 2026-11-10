// brand.uniyel.com (and /brand on localhost)
import BrandApp from './BrandApp';
import { loadSession } from '../_dashboard/session';

export const metadata = { title: 'Brand Dashboard' };

export default async function BrandPage() {
    return <BrandApp result={await loadSession()} />;
}
