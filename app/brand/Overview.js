'use client';

import { useMemo } from 'react';
import { FiUsers, FiUploadCloud, FiTrendingUp } from 'react-icons/fi';
import ui from '../_shared/ui/ui.module.css';
import { bizPost } from '../../utils/bizApi';
import { compactRupees } from '../_shared/ui/format';
import { Empty, cx } from '../_shared/ui/parts';
import { useOverview, Attention, SalesCards, OverviewSkeleton, overviewStyles as styles } from '../_shared/overview/parts';

// Brand home: sales across the brand's own store and its distributors.
export default function BrandOverview({ auth, session, addNotification, onNavigate }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const { overview, error } = useOverview(creds, addNotification);
    if (error) return <div className={ui.page}><Empty title="Could not load your brand overview">Please refresh the page.</Empty></div>;
    if (!overview) return <OverviewSkeleton />;
    const b = overview.brand;
    const channels = b.channels_30d || [];
    const total = channels.reduce((s, c) => s + c.sold, 0);
    const direct = channels.filter((c) => c.direct).reduce((s, c) => s + c.sold, 0);

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>{overview.account.name}</h1>
                    <p className={ui.subtitle}>Brand overview — your products across your own store and your distributors.</p>
                </div>
                <div className={ui.headerActions}>
                    <button className={ui.btn} onClick={() => onNavigate('distributors')}><FiUsers size={15} /> Distributors</button>
                    <button className={cx(ui.btn, ui.btnPrimary)} onClick={() => onNavigate('upload')}><FiUploadCloud size={15} /> Upload brand product</button>
                </div>
            </div>

            <Attention
                overview={overview}
                onNavigate={onNavigate}
                extra={[{ key: 'requests', icon: FiUsers, value: b.distributors.pending, label: 'distributor requests', tab: 'distributors' }]}
            />

            <div className={ui.cards}>
                <div className={cx(ui.card, ui.cardAccent)}>
                    <span className={ui.cardLabel}>Brand sales · 30 days</span>
                    <span className={ui.cardValue}>{compactRupees(total)}</span>
                    <span className={ui.cardHint}>All channels</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Direct (your store)</span>
                    <span className={ui.cardValue}>{compactRupees(direct)}</span>
                    <span className={ui.cardHint}>Profit {compactRupees(overview.sales.month.profit)}</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Through distributors</span>
                    <span className={ui.cardValue}>{compactRupees(total - direct)}</span>
                    <span className={ui.cardHint}>{b.distributors.approved} active distributor{b.distributors.approved === 1 ? '' : 's'}</span>
                </div>
                <div className={ui.card}>
                    <span className={ui.cardLabel}>Products under your brand</span>
                    <span className={ui.cardValue}>{b.products_listed}</span>
                    <span className={ui.cardHint}>{b.products_by_distributors} listed by distributors</span>
                </div>
            </div>

            <div className={ui.grid2}>
                <div className={ui.panel}>
                    <div className={ui.panelHead}>
                        <h3 className={ui.panelTitle}>Sales by channel · 30 days</h3>
                        <button className={ui.btnLink} onClick={() => onNavigate('brand-sales')}>All brand sales →</button>
                    </div>
                    {channels.length ? (
                        <div className={ui.panelBody} style={{ display: 'grid', gap: 12 }}>
                            {channels.map((c) => (
                                <div key={c.id}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                                        <span><strong>{c.name}</strong> <span className={ui.mutedText}>· {c.orders} orders · {c.units} units</span></span>
                                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{compactRupees(c.sold)}</span>
                                    </div>
                                    <div className={styles.bar}><span style={{ width: `${total ? Math.max(2, (c.sold / total) * 100) : 0}%` }} data-direct={c.direct} /></div>
                                </div>
                            ))}
                        </div>
                    ) : <Empty icon={FiTrendingUp} title="No brand sales in the last 30 days" />}
                </div>
                <div className={ui.panel}>
                    <div className={ui.panelHead}><h3 className={ui.panelTitle}>Your store · last 30 days</h3></div>
                    <div className={ui.panelBody}><SalesCards sales={overview.sales} /></div>
                </div>
            </div>
        </div>
    );
}
