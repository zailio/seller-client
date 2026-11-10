'use client';

import { useCallback, useEffect, useState } from 'react';
import { FiMessageSquare, FiStar, FiHelpCircle, FiCornerDownRight } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { bizPost } from '../../../utils/bizApi';
import { timeAgo, dateTime } from '../ui/format';
import { Badge, Empty, Pager, Initials, Thumb, cx } from '../ui/parts';

const COPY = {
    comments: { icon: FiMessageSquare, noun: 'comment', empty: 'No comments yet', max: 500, placeholder: 'Reply publicly to this comment…' },
    reviews: { icon: FiStar, noun: 'review', empty: 'No reviews yet', max: 1000, placeholder: 'Respond to this review…' },
    questions: { icon: FiHelpCircle, noun: 'question', empty: 'No questions yet', max: 255, placeholder: 'Answer this question…' },
};

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'unanswered', label: 'Unanswered' },
    { id: 'answered', label: 'Answered' },
    { id: 'recent', label: 'Recent (7 days)' },
];

// One feedback type (comments, reviews or questions) with its own filters and replies.
export default function FeedbackPanel({ type, creds, addNotification, onReplied }) {
    const copy = COPY[type];
    const [filter, setFilter] = useState('unanswered');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], total: 0, total_pages: 1, counts: null });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (p, f) => {
        setLoading(true);
        try {
            setData(await bizPost('feedback/list', creds, { type, filter: f, page: p }));
        } catch (err) {
            addNotification({ h2: 'Feedback', desc: err.message, tag: 'error' });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creds, type]);

    useEffect(() => { setPage(1); load(1, filter); }, [filter, load]);

    const onReply = (id, reply) => {
        setData((d) => ({
            ...d,
            items: d.items.map((item) => (item.id === id
                ? { ...item, answered: true, replies: type === 'comments' ? [...item.replies, reply] : [reply] }
                : item)),
        }));
        if (onReplied) onReplied();
    };

    const counts = data.counts;

    return (
        <div className={ui.panel}>
            <div className={ui.toolbar}>
                <div className={ui.chips} role="group" aria-label="Filter">
                    {FILTERS.map((f) => (
                        <button key={f.id} className={cx(ui.chip, filter === f.id && ui.chipActive)} onClick={() => setFilter(f.id)}>
                            {f.label}
                            {counts && f.id !== 'recent' && <span className={ui.chipCount}>{counts[f.id]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div className={ui.list}>
                {loading && !data.items.length && [0, 1, 2].map((i) => (
                    <div key={i} className={ui.item}>
                        <span className={ui.avatar} />
                        <div className={ui.itemBody} style={{ display: 'grid', gap: 8 }}>
                            <span className={ui.skeleton} style={{ width: '40%' }} />
                            <span className={ui.skeleton} style={{ width: '85%' }} />
                        </div>
                    </div>
                ))}
                {data.items.map((item) => (
                    <FeedbackItem key={item.id} item={item} type={type} copy={copy} creds={creds} addNotification={addNotification} onReply={onReply} />
                ))}
            </div>
            {!loading && !data.items.length && (
                <Empty icon={copy.icon} title={filter === 'unanswered' ? `No unanswered ${copy.noun}s` : copy.empty}>
                    {filter === 'unanswered' ? 'You are all caught up.' : `Customer ${copy.noun}s on your products will appear here.`}
                </Empty>
            )}
            <Pager page={page} totalPages={data.total_pages} total={data.total} label={`${copy.noun}s`} onPage={(p) => { setPage(p); load(p, filter); }} disabled={loading} />
        </div>
    );
}

function FeedbackItem({ item, type, copy, creds, addNotification, onReply }) {
    // comments allow several replies; reviews & questions have one editable answer
    const canReplyAgain = type === 'comments' || !item.answered;
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const send = async () => {
        setSending(true);
        try {
            const res = await bizPost('feedback/reply', creds, { type, id: item.id, text });
            onReply(item.id, { ...res.reply, at: res.reply.at || new Date().toISOString() });
            setText('');
            setOpen(false);
            addNotification({ h2: 'Reply posted', desc: `Your reply to this ${copy.noun} is live.`, tag: 'done' });
        } catch (err) {
            addNotification({ h2: 'Reply failed', desc: err.message, tag: 'error' });
        } finally {
            setSending(false);
        }
    };

    const startEdit = () => {
        setText(item.replies[0]?.text || '');
        setOpen(true);
    };

    return (
        <div className={ui.item}>
            <Initials name={item.customer.name} img={item.customer.img} />
            <div className={ui.itemBody}>
                <div className={ui.itemMeta}>
                    <strong style={{ color: '#1f2328' }}>{item.customer.name}</strong>
                    {type === 'reviews' && <span className={ui.stars} aria-label={`${item.rating} out of 5`}>{'★'.repeat(item.rating)}<span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - item.rating)}</span></span>}
                    <span title={dateTime(item.created_at)}>{timeAgo(item.created_at)}</span>
                    {type === 'reviews' && item.location && <span>· {item.location}</span>}
                    {type === 'reviews' && item.order_id && <span className={ui.mono}>· #ORD-{item.order_id}</span>}
                    {item.answered ? <Badge tone="success">Answered</Badge> : <Badge tone="warning">Awaiting reply</Badge>}
                </div>
                <div className={ui.itemMeta} style={{ marginTop: 6 }}>
                    <Thumb src={item.product.image} />
                    <span className={ui.cellTitle} style={{ maxWidth: 360, color: '#374151' }}>{item.product.title}</span>
                </div>
                {item.text && <p className={ui.itemText}>{item.text}</p>}
                {type === 'reviews' && item.images?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {item.images.slice(0, 4).map((src, i) => <Thumb key={i} src={src} />)}
                    </div>
                )}

                {item.replies.map((r) => (
                    <div key={`${r.id}-${r.at}`} className={ui.reply}>
                        <span className={ui.replyMeta}><FiCornerDownRight size={11} /> Your reply · {timeAgo(r.at)}{r.edited ? ' · edited' : ''}</span>
                        {r.text}
                    </div>
                ))}

                {open ? (
                    <div className={ui.replyForm}>
                        <textarea className={ui.textarea} value={text} maxLength={copy.max} onChange={(e) => setText(e.target.value)} placeholder={copy.placeholder} autoFocus />
                        <div className={ui.replyActions}>
                            <span className={ui.cellSub} style={{ marginRight: 'auto' }}>{text.length}/{copy.max}</span>
                            <button className={cx(ui.btn, ui.btnSm)} onClick={() => setOpen(false)} disabled={sending}>Cancel</button>
                            <button className={cx(ui.btn, ui.btnSm, ui.btnPrimary)} onClick={send} disabled={sending || !text.trim()}>{sending ? 'Posting…' : 'Post reply'}</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                        {canReplyAgain && <button className={ui.btnLink} onClick={() => setOpen(true)}>{item.answered ? 'Reply again' : 'Reply'}</button>}
                        {!canReplyAgain && <button className={ui.btnLink} onClick={startEdit}>Edit reply</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
