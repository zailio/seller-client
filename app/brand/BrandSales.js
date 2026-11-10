'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import ui from '../_shared/ui/ui.module.css';
import { bizPost } from '../../utils/bizApi';
import { rupees, compactRupees, shortDate, orderStatus } from '../_shared/ui/format';
import { Badge, Empty, Initials, Pager, SkeletonRows, Thumb, cx, useDebouncedEffect } from '../_shared/ui/parts';

/* ───────── Brand: sales across every channel ───────── */

export default function BrandSales({ auth, session, addNotification }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [range, setRange] = useState(30);
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (p) => {
        setLoading(true);
        try {
            const from = range ? new Date(Date.now() - (range - 1) * 864e5).toISOString().slice(0, 10) : undefined;
            setData(await bizPost('brand/sales', creds, { from, page: p }));
        } catch (err) {
            addNotification({ h2: 'Brand sales', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds, range]);
    useEffect(() => { setPage(1); load(1); }, [load]);

    const channels = data?.channels || [];
    const total = channels.reduce((s, c) => s + c.sold, 0);

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>Brand sales</h1>
                    <p className={ui.subtitle}>Every order of a product under your brand — from your own store and from your distributors. Distributor orders show no customer details or distributor margins.</p>
                </div>
                <div className={ui.chips}>
                    {[[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All time']].map(([d, label]) => (
                        <button key={d} className={cx(ui.chip, range === d && ui.chipActive)} onClick={() => setRange(d)}>{label}</button>
                    ))}
                </div>
            </div>

            <div className={ui.cards}>
                <div className={cx(ui.card, ui.cardAccent)}><span className={ui.cardLabel}>Total brand sales</span><span className={ui.cardValue}>{compactRupees(total)}</span><span className={ui.cardHint}>Excludes cancelled orders</span></div>
                {channels.slice(0, 3).map((c) => (
                    <div key={c.id} className={ui.card}>
                        <span className={ui.cardLabel}>{c.name}</span>
                        <span className={ui.cardValue}>{compactRupees(c.sold)}</span>
                        <span className={ui.cardHint}>{c.orders} orders · {c.units} units</span>
                    </div>
                ))}
            </div>

            <div className={ui.panel}>
                <div className={ui.tableWrap}>
                    <table className={ui.table}>
                        <thead>
                            <tr><th>Order</th><th>Product</th><th>Channel</th><th>State</th><th className={ui.num}>Qty</th><th className={ui.num}>Sold price</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {loading && !data ? <SkeletonRows rows={6} cols={7} /> : (data?.orders || []).map((o) => {
                                const st = orderStatus(o.status, o.visible_status);
                                return (
                                    <tr key={o.id}>
                                        <td><span className={cx(ui.cellTitle, ui.mono)}>{o.order_label}</span><span className={ui.cellSub}>{shortDate(o.created_at)}</span></td>
                                        <td><div className={ui.productCell}><Thumb src={o.product.image} /><span className={ui.cellTitle}>{o.product.title}</span></div></td>
                                        <td>{o.channel.direct ? <Badge tone="info">Direct</Badge> : o.channel.name}</td>
                                        <td>{o.state || '—'}</td>
                                        <td className={ui.num}>{o.quantity}</td>
                                        <td className={ui.num}>{rupees(o.sold_price)}</td>
                                        <td><Badge tone={st.tone}>{st.label}</Badge></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!loading && data && !data.orders.length && <Empty icon={FiTrendingUp} title="No brand sales in this period" />}
                </div>
                {data && <Pager page={page} totalPages={data.total_pages} total={data.total} label="orders" onPage={(p) => { setPage(p); load(p); }} disabled={loading} />}
            </div>
        </div>
    );
}
