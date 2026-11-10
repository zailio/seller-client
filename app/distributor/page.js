// distributor.uniyel.com / brand-distributor.uniyel.com (and /distributor on localhost)
import DistributorApp from './DistributorApp';
import { loadSession } from '../_dashboard/session';

export const metadata = { title: 'Distributor Dashboard' };

export default async function DistributorPage() {
    return <DistributorApp result={await loadSession()} />;
}
