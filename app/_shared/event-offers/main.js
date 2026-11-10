'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiGift, FiCalendar, FiInfo } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import styles from './eventOffers.module.css';
import { bizPost } from '../../../utils/bizApi';
import { shortDate } from '../ui/format';
import { Badge, Empty, cx } from '../ui/parts';

const STATE = {
    always: { label: 'Every birthday', tone: 'info' },
    live: { label: 'Live now', tone: 'success' },
    upcoming: { label: 'Upcoming', tone: 'neutral' },
};

// Events are run by Uniyel: festivals from the admin panel, the birthday event by the
// system. A seller only turns each one on or off and sets its discount. Discounts apply
// only to products whose "Event offers" switch is on in Upload | Update.
export default function EventOffers({ auth, session, addNotification }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setEvents((await bizPost('event-offers/list', creds)).events);
        } catch (err) {
            addNotification({ h2: 'Event offers', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds]);
    useEffect(() => { load(); }, [load]);

    const percentOf = (e) => (drafts[e.key] !== undefined ? drafts[e.key] : e.discount_percent ?? '');

    const save = async (e, active) => {
        const percent = percentOf(e);
        if (active && !(Number(percent) > 0)) {
            addNotification({ h2: 'Set a discount', desc: `Enter how much % off you give for ${e.name}.`, tag: 'error' });
            return;
        }
        setSaving(e.key);
        try {
            const res = await bizPost('event-offers/save', creds, {
                event_key: e.key,
                active,
                discount_percent: percent === '' ? undefined : Number(percent),
            });
            setEvents(res.events);
            setDrafts((d) => { const next = { ...d }; delete next[e.key]; return next; });
            addNotification({
                h2: active ? 'Offer on' : 'Offer off',
                desc: active ? `${e.name}: ${Number(percent)}% off on your event-offer products.` : `You left ${e.name}.`,
                tag: 'done',
            });
        } catch (err) {
            addNotification({ h2: 'Could not save', desc: err.message, tag: 'error' });
        } finally {
            setSaving(null);
        }
    };

    const birthday = events.find((e) => e.key === 'birthday');
    const festivals = events.filter((e) => e.key !== 'birthday');

    // a render function (not a component) so the % input keeps focus while typing
    const renderRow = (e) => {
        const st = STATE[e.state] || STATE.upcoming;
        const dirty = drafts[e.key] !== undefined && Number(drafts[e.key]) !== Number(e.discount_percent);
        return (
            <div key={e.key} className={styles.row} data-joined={e.joined}>
                <span className={styles.icon} data-type={e.type}>{e.type === 'birthday' ? <FiGift size={18} /> : <FiCalendar size={18} />}</span>
                <div className={styles.info}>
                    <div className={ui.itemMeta}>
                        <strong className={styles.name}>{e.name}</strong>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <span className={styles.by}>{e.created_by === 'system' ? 'System event' : 'Uniyel event'}</span>
                    </div>
                    <span className={ui.cellSub} style={{ whiteSpace: 'normal' }}>
                        {e.type === 'birthday' ? e.description : `${shortDate(e.starts_at)} – ${shortDate(e.ends_at)}`}
                    </span>
                </div>
                <label className={styles.percent}>
                    <input
                        className={ui.input}
                        inputMode="decimal"
                        value={percentOf(e)}
                        placeholder="0"
                        aria-label={`Discount for ${e.name}`}
                        onChange={(ev) => setDrafts((d) => ({ ...d, [e.key]: ev.target.value.replace(/[^\d.]/g, '').slice(0, 5) }))}
                    />
                    <span>% off</span>
                </label>
                {e.joined && dirty && (
                    <button className={cx(ui.btn, ui.btnSm, ui.btnPrimary)} disabled={saving === e.key} onClick={() => save(e, true)}>Save</button>
                )}
                <label className={styles.switch} aria-label={`${e.joined ? 'Turn off' : 'Turn on'} ${e.name}`}>
                    <input type="checkbox" checked={e.joined} disabled={saving === e.key} onChange={(ev) => save(e, ev.target.checked)} />
                    <span className={styles.track}><span className={styles.thumb} /></span>
                    <span className={styles.switchText}>{e.joined ? 'On' : 'Off'}</span>
                </label>
            </div>
        );
    };

    return (
        <div className={ui.page}>
            <div className={ui.header}>
                <div>
                    <h1 className={ui.title}>Event offers</h1>
                    <p className={ui.subtitle}>Uniyel runs birthday and festival events. Turn on the ones you want to join and choose how much % off you give. You fund the discount.</p>
                </div>
            </div>

            <div className={cx(ui.notice)} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <FiInfo size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                    Discounts only apply to products with <strong>Event offers</strong> turned on in <em>Upload | Update</em> (same place as Allow Affiliation).
                    The discount is taken off your current selling price at checkout and shown as “Event offer fee” on the order.
                </span>
            </div>

            {loading ? (
                <div className={ui.panel}><div className={ui.panelBody}><span className={ui.skeleton} style={{ width: '50%' }} /></div></div>
            ) : (
                <>
                    {birthday && (
                        <div className={ui.panel}>
                            <div className={ui.panelHead}><h3 className={ui.panelTitle}>Birthday</h3></div>
                            {renderRow(birthday)}
                        </div>
                    )}
                    <div className={ui.panel}>
                        <div className={ui.panelHead}><h3 className={ui.panelTitle}>Festivals & special events</h3></div>
                        {festivals.length ? festivals.map(renderRow) : (
                            <Empty icon={FiCalendar} title="No upcoming events">Uniyel will announce festival events like Onam and Diwali here. You can join them when they appear.</Empty>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
