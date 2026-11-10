'use client';

import { useMemo } from 'react';
import { FiPackage, FiTruck, FiUsers, FiUploadCloud } from 'react-icons/fi';
import ui from '../_shared/ui/ui.module.css';
import { bizPost } from '../../utils/bizApi';
import { compactRupees } from '../_shared/ui/format';
import { Empty, cx } from '../_shared/ui/parts';
import { useOverview, Attention, SalesCards, OverviewSkeleton, overviewStyles as styles } from '../_shared/overview/parts';

// Distributor home: fulfilment, stock and the brands it distributes.
export default function DistributorOverview({ auth, session, addNotification, onNavigate }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const { overview, error } = useOverview(creds, addNotification);
    if (error) return <div className={ui.page}><Empty title="Could not load your overview">Please refresh the page.</Empty></div>;
    if (!overview) return <OverviewSkeleton />;
    const d = overview.distribution;

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>{overview.account.name}</h1>
                    <p className={ui.subtitle}>Distributor overview — fulfilment, stock and sales for the brands you distribute.</p>
                </div>
                <div className={ui.headerActions}>
                    <button className={ui.btn} onClick={() => onNavigate('orders')}><FiTruck size={15} /> Fulfil orders</button>
                    <button className={cx(ui.btn, ui.btnPrimary)} onClick={() => onNavigate('upload')} disabled={!d.brands.length}><FiUploadCloud size={15} /> Upload product</button>
                </div>
            </div>

            <Attention
                overview={overview}
                onNavigate={onNavigate}
                extra={d.pending_requests ? [{ key: 'pending', icon: FiUsers, value: d.pending_requests, label: 'requests awaiting brands', tab: 'brands' }] : []}
            />

            <SalesCards sales={overview.sales} />

            <div className={ui.panel}>
                <div className={ui.panelHead}>
                    <h3 className={ui.panelTitle}>Brands you distribute</h3>
                    <button className={ui.btnLink} onClick={() => onNavigate('brands')}>Manage brands →</button>
                </div>
                {d.brands.length ? (
                    <div className={ui.tableWrap}>
                        <table className={ui.table}>
                            <thead><tr><th>Brand</th><th className={ui.num}>Your listings</th><th /></tr></thead>
                            <tbody>
                                {d.brands.map((brand) => (
                                    <tr key={brand.id}>
                                        <td><strong>{brand.name}</strong></td>
                                        <td className={ui.num}>{brand.products}</td>
                                        <td style={{ textAlign: 'right' }}><button className={ui.btnLink} onClick={() => onNavigate('products')}>View products</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty icon={FiPackage} title="No approved brands yet" action={<button className={cx(ui.btn, ui.btnPrimary)} onClick={() => onNavigate('brands')}>Find a brand</button>}>
                        Ask a brand to approve you as a distributor. Once approved you can list and sell its products.
                    </Empty>
                )}
            </div>
        </div>
    );
}
