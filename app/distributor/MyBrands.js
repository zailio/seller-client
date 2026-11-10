'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiUsers, FiSearch, FiSend } from 'react-icons/fi';
import ui from '../_shared/ui/ui.module.css';
import { bizPost } from '../../utils/bizApi';
import { shortDate, timeAgo, LINK_STATUS } from '../_shared/ui/format';
import { Badge, Empty, Initials, Pager, SkeletonRows, Thumb, cx, useDebouncedEffect } from '../_shared/ui/parts';

/* ───────── Distributor: brands I distribute / request access ───────── */

export default function MyBrands({ auth, session, addNotification }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [requesting, setRequesting] = useState(null);
    const [note, setNote] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setLinks((await bizPost('distributor/brands', creds)).brands);
        } catch (err) {
            addNotification({ h2: 'Brands', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds]);
    useEffect(() => { load(); }, [load]);

    useDebouncedEffect(() => {
        if (!q.trim()) { setResults([]); return; }
        setSearching(true);
        bizPost('distributor/brands/search', creds, { q })
            .then((d) => setResults(d.brands))
            .catch(() => setResults([]))
            .finally(() => setSearching(false));
    }, [q], 350);

    const request = async (brand) => {
        try {
            await bizPost('distributor/brands/request', creds, { brand_id: brand.id, note });
            addNotification({ h2: 'Request sent', desc: `${brand.name} will review your request.`, tag: 'done' });
            setRequesting(null);
            setNote('');
            setQ('');
            setResults([]);
            load();
        } catch (err) {
            addNotification({ h2: 'Request failed', desc: err.message, tag: 'error' });
        }
    };

    const approved = links.filter((l) => l.status === 'approved');
    const others = links.filter((l) => l.status !== 'approved');

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>My brands</h1>
                    <p className={ui.subtitle}>Brands that approved you can be chosen when you upload products. Request access to more brands below.</p>
                </div>
            </div>

            <div className={ui.grid2}>
                <div className={ui.panel}>
                    <div className={ui.panelHead}><h3 className={ui.panelTitle}>Approved brands ({approved.length})</h3></div>
                    {loading ? <div className={ui.panelBody}><span className={ui.skeleton} style={{ width: '60%' }} /></div> : approved.length ? (
                        <div className={ui.list}>
                            {approved.map((l) => (
                                <div key={l.id} className={ui.item} style={{ alignItems: 'center' }}>
                                    <Initials name={l.account?.name} />
                                    <div className={ui.itemBody}>
                                        <strong>{l.account?.name}</strong>
                                        <span className={ui.cellSub}>Approved {l.decided_at ? shortDate(l.decided_at) : ''}</span>
                                    </div>
                                    <Badge tone="success">Approved</Badge>
                                </div>
                            ))}
                        </div>
                    ) : <Empty icon={FiUsers} title="No approved brands yet">Search for a brand and send a request.</Empty>}
                    {others.length > 0 && (
                        <>
                            <div className={ui.panelHead} style={{ borderTop: '1px solid #e5e7eb' }}><h3 className={ui.panelTitle}>Requests</h3></div>
                            <div className={ui.list}>
                                {others.map((l) => {
                                    const st = LINK_STATUS[l.status];
                                    return (
                                        <div key={l.id} className={ui.item} style={{ alignItems: 'center' }}>
                                            <Initials name={l.account?.name} />
                                            <div className={ui.itemBody}>
                                                <strong>{l.account?.name}</strong>
                                                <span className={ui.cellSub}>Requested {timeAgo(l.requested_at)}</span>
                                            </div>
                                            <Badge tone={st.tone}>{st.label}</Badge>
                                            {['rejected', 'revoked'].includes(l.status) && l.account && (
                                                <button className={cx(ui.btn, ui.btnSm)} onClick={() => setRequesting(l.account)}>Ask again</button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className={ui.panel}>
                    <div className={ui.panelHead}><h3 className={ui.panelTitle}>Find a brand</h3></div>
                    <div className={ui.panelBody} style={{ display: 'grid', gap: 12 }}>
                        <div className={ui.search}>
                            <FiSearch size={15} />
                            <input className={ui.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brands by name" aria-label="Search brands" />
                        </div>
                        {searching && <span className={ui.cellSub}>Searching…</span>}
                        {results.map((b) => (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Initials name={b.name} />
                                <strong style={{ flex: 1 }}>{b.name}</strong>
                                <button className={cx(ui.btn, ui.btnSm)} onClick={() => setRequesting(b)}>Request access</button>
                            </div>
                        ))}
                        {!searching && q.trim() && !results.length && <span className={ui.cellSub}>No brands found (brands you already distribute or have a pending request with are hidden).</span>}

                        {requesting && (
                            <div className={ui.notice} style={{ display: 'grid', gap: 8 }}>
                                <strong style={{ color: '#1f2328' }}>Request to distribute {requesting.name}</strong>
                                <textarea className={ui.textarea} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell the brand about your business — regions, warehouses, volume (optional)" />
                                <div className={ui.replyActions}>
                                    <button className={cx(ui.btn, ui.btnSm)} onClick={() => setRequesting(null)}>Cancel</button>
                                    <button className={cx(ui.btn, ui.btnSm, ui.btnPrimary)} onClick={() => request(requesting)}><FiSend size={13} /> Send request</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
