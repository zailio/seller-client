'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiUsers, FiCheck, FiX, FiSlash } from 'react-icons/fi';
import ui from '../_shared/ui/ui.module.css';
import { bizPost } from '../../utils/bizApi';
import { timeAgo, LINK_STATUS } from '../_shared/ui/format';
import { Badge, Empty, Initials, Pager, SkeletonRows, Thumb, cx, useDebouncedEffect } from '../_shared/ui/parts';

/* ───────── Brand: approve distributors ───────── */

export default function Distributors({ auth, session, addNotification }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [busy, setBusy] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const d = await bizPost('brand/distributors', creds);
            setLinks(d.distributors);
            if (!d.distributors.some((l) => l.status === 'pending')) setFilter((f) => (f === 'pending' ? 'all' : f));
        } catch (err) {
            addNotification({ h2: 'Distributors', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds]);
    useEffect(() => { load(); }, [load]);

    const decide = async (link, action) => {
        if (action === 'revoke' && !window.confirm(`Revoke ${link.account?.name}? They will no longer be able to upload products under your brand.`)) return;
        setBusy(link.id);
        try {
            const res = await bizPost('brand/distributors/decide', creds, { link_id: link.id, action });
            setLinks((list) => list.map((l) => (l.id === link.id ? { ...l, status: res.link_status, decided_at: new Date().toISOString() } : l)));
        } catch (err) {
            addNotification({ h2: 'Could not update', desc: err.message, tag: 'error' });
        } finally {
            setBusy(null);
        }
    };

    const counts = links.reduce((acc, l) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }), {});
    const visible = filter === 'all' ? links : links.filter((l) => l.status === filter);

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>Distributors</h1>
                    <p className={ui.subtitle}>Approve who may list and sell your brand’s products. You can revoke access at any time.</p>
                </div>
            </div>
            <div className={ui.panel}>
                <div className={ui.toolbar}>
                    <div className={ui.chips}>
                        {['pending', 'approved', 'rejected', 'revoked', 'all'].map((f) => (
                            <button key={f} className={cx(ui.chip, filter === f && ui.chipActive)} onClick={() => setFilter(f)}>
                                {f === 'all' ? 'All' : LINK_STATUS[f].label}
                                <span className={ui.chipCount}>{f === 'all' ? links.length : counts[f] || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {loading ? <div className={ui.panelBody}><span className={ui.skeleton} style={{ width: '60%' }} /></div> : visible.length ? (
                    <div className={ui.list}>
                        {visible.map((l) => {
                            const st = LINK_STATUS[l.status];
                            return (
                                <div key={l.id} className={ui.item} style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Initials name={l.account?.name} />
                                    <div className={ui.itemBody}>
                                        <div className={ui.itemMeta}>
                                            <strong style={{ color: '#1f2328', fontSize: 14 }}>{l.account?.name || 'Distributor'}</strong>
                                            <Badge tone={st.tone}>{st.label}</Badge>
                                            <span>requested {timeAgo(l.requested_at)}</span>
                                        </div>
                                        {l.note && <p className={ui.itemText} style={{ color: '#4b5563' }}>“{l.note}”</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {l.status === 'pending' && <>
                                            <button className={cx(ui.btn, ui.btnSm)} disabled={busy === l.id} onClick={() => decide(l, 'reject')}><FiX size={13} /> Reject</button>
                                            <button className={cx(ui.btn, ui.btnSm, ui.btnPrimary)} disabled={busy === l.id} onClick={() => decide(l, 'approve')}><FiCheck size={13} /> Approve</button>
                                        </>}
                                        {l.status === 'approved' && <button className={cx(ui.btn, ui.btnSm, ui.btnDanger)} disabled={busy === l.id} onClick={() => decide(l, 'revoke')}><FiSlash size={13} /> Revoke</button>}
                                        {l.status === 'rejected' && <button className={cx(ui.btn, ui.btnSm)} disabled={busy === l.id} onClick={() => decide(l, 'approve')}>Approve instead</button>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Empty icon={FiUsers} title={filter === 'pending' ? 'No pending requests' : 'No distributors here'}>
                        Distributors find your brand from their dashboard and request access. Requests appear here and in your notifications.
                    </Empty>
                )}
            </div>
        </div>
    );
}
