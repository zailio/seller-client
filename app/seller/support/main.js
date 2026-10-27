'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FiPackage, FiTag, FiZap, FiCalendar, FiGift, FiShoppingBag, FiUser, FiTool,
    FiMessageSquare, FiPlus, FiSend, FiX, FiChevronLeft, FiSearch, FiClock,
    FiCheckCircle, FiInbox, FiLifeBuoy, FiAlertCircle, FiLock, FiInfo,
} from 'react-icons/fi';
import styles from './page.module.css';

/* ------------------------------------------------------------------ */
/* Config: add, remove or rename tabs here                             */
/* ------------------------------------------------------------------ */
const TABS = [
    { id: 'orders', label: 'Orders', Icon: FiPackage, tone: '#4f46e5', soft: '#e0e7ff', hint: 'Shipping, returns, refunds and payment holds', placeholder: 'Share the order ID and what went wrong…' },
    { id: 'products', label: 'Products', Icon: FiTag, tone: '#0d9488', soft: '#ccfbf1', hint: 'Listings, stock, images and approvals', placeholder: 'Share the product name or SKU and the problem…' },
    { id: 'features', label: 'New features', Icon: FiZap, tone: '#d97706', soft: '#fef3c7', hint: 'Questions or requests about new tools', placeholder: 'Which feature are you asking about?' },
    { id: 'events', label: 'Events', Icon: FiCalendar, tone: '#db2777', soft: '#fce7f3', hint: 'Sales events, campaigns and registrations', placeholder: 'Tell us which event and what you need…' },
    { id: 'offers', label: 'Offers', Icon: FiGift, tone: '#ea580c', soft: '#ffedd5', hint: 'Discounts, coupons and promotions', placeholder: 'Share the offer name or code and the issue…' },
    { id: 'storefront', label: 'Storefront', Icon: FiShoppingBag, tone: '#0284c7', soft: '#e0f2fe', hint: 'Store design, domain and visibility', placeholder: 'Describe what you see on your storefront…' },
    { id: 'profile', label: 'Profile', Icon: FiUser, tone: '#16a34a', soft: '#dcfce7', hint: 'Account, KYC, bank details and payouts', placeholder: 'Tell us what needs to change on your profile…' },
    { id: 'custom', label: 'Custom', Icon: FiTool, tone: '#475569', soft: '#e2e8f0', hint: 'Anything that does not fit the other tabs', placeholder: 'Describe your request in as much detail as you can…' },
];

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
];

const TIPS = [
    'Add the order ID, SKU or offer code so we can find it fast.',
    'Describe what you expected and what actually happened.',
    'One issue per chat. You can reply inside a chat as often as you like.',
];

const EMPTY_FORM = { subject: '', message: '' };
const SUBJECT_MAX = 80;
const MESSAGE_MAX = 1500;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const getMonthKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const fmtTime = (ts) =>
    new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).format(ts);

const fmtDay = (ts) =>
    new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(ts);

const fmtResetDate = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(next);
};

/*
  Stores tickets in localStorage under a key that includes the month, so the
  quota resets itself. Loads after mount (safe for Next.js server rendering) and
  never writes until the stored value for the current key has been read.
*/
function useMonthlyTickets(key) {
    const [tickets, setTickets] = useState([]);
    const [loadedKey, setLoadedKey] = useState(null);

    useEffect(() => {
        let stored = [];
        try {
            const raw = window.localStorage.getItem(key);
            stored = raw ? JSON.parse(raw) : [];
        } catch {
            stored = [];
        }
        setTickets(Array.isArray(stored) ? stored : []);
        setLoadedKey(key);
    }, [key]);

    useEffect(() => {
        if (loadedKey !== key) return;
        try {
            window.localStorage.setItem(key, JSON.stringify(tickets));
        } catch {
            /* storage unavailable: keep working in memory */
        }
    }, [key, tickets, loadedKey]);

    return [tickets, setTickets];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
/**
 * Props
 *  sellerId        string   used in the storage key (default "seller")
 *  monthlyLimit    number   tickets per month (default 5)
 *  onTicketCreated (ticket) => void | Promise     call your API here
 *  onSendMessage   ({ ticketId, tab, text }) => Promise<string | void>
 *                  resolve with a reply string to show an agent message
 */
export default function SupportCenter({
    sellerId = 'seller',
    monthlyLimit = 5,
    onTicketCreated,
    onSendMessage,
}) {
    const monthKey = getMonthKey();
    const [tickets, setTickets] = useMonthlyTickets(`zailio-support:${sellerId}:${monthKey}`);

    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [activeId, setActiveId] = useState(null); // null | 'new' | ticket id
    const [form, setForm] = useState(EMPTY_FORM);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const tabRefs = useRef([]);
    const endRef = useRef(null);
    const composerRef = useRef(null);

    const used = tickets.length;
    const remaining = Math.max(0, monthlyLimit - used);
    const openCount = tickets.filter((t) => t.status === 'open').length;
    const closedCount = used - openCount;
    const usedPct = monthlyLimit > 0 ? Math.min(100, Math.round((used / monthlyLimit) * 100)) : 100;

    const tab = TABS.find((t) => t.id === activeTab);
    const activeTicket = tickets.find((t) => t.id === activeId) || null;

    const tabTickets = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tickets
            .filter((t) => t.tab === activeTab)
            .filter((t) => statusFilter === 'all' || t.status === statusFilter)
            .filter(
                (t) =>
                    !q ||
                    t.subject.toLowerCase().includes(q) ||
                    t.ref.toLowerCase().includes(q) ||
                    t.messages.some((m) => m.text.toLowerCase().includes(q)),
            )
            .sort((a, b) => b.updatedAt - a.updatedAt);
    }, [tickets, activeTab, statusFilter, query]);

    const tabTotal = tickets.filter((t) => t.tab === activeTab).length;

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [activeTicket?.messages.length, activeId]);

    // grow the composer with its content (up to a limit set in CSS)
    useEffect(() => {
        const el = composerRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }, [reply, activeId]);

    useEffect(() => {
        setConfirmClose(false);
    }, [activeId]);

    /* ---------- tabs ---------- */
    const selectTab = (id) => {
        setActiveTab(id);
        setActiveId(null);
        setQuery('');
        setStatusFilter('all');
    };

    const onTabKeyDown = (e) => {
        const i = TABS.findIndex((t) => t.id === activeTab);
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % TABS.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + TABS.length) % TABS.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = TABS.length - 1;
        if (next === null) return;
        e.preventDefault();
        selectTab(TABS[next].id);
        tabRefs.current[next]?.focus();
    };

    /* ---------- tickets ---------- */
    const appendMessage = useCallback(
        (ticketId, msg) =>
            setTickets((prev) =>
                prev.map((t) =>
                    t.id === ticketId ? { ...t, messages: [...t.messages, msg], updatedAt: msg.at } : t,
                ),
            ),
        [setTickets],
    );

    const createTicket = (e) => {
        e.preventDefault();
        const subject = form.subject.trim();
        const message = form.message.trim();
        if (remaining <= 0 || !subject || !message) return;

        const now = Date.now();
        const ticket = {
            id: uid(),
            ref: `ZL-${monthKey.replace('-', '')}-${String(used + 1).padStart(2, '0')}`,
            tab: activeTab,
            subject,
            status: 'open',
            createdAt: now,
            updatedAt: now + 1,
            messages: [
                { id: uid(), from: 'seller', text: message, at: now },
                {
                    id: uid(),
                    from: 'system',
                    text: 'Ticket received. Our support team usually replies within 24 hours.',
                    at: now + 1,
                },
            ],
        };

        setTickets((prev) => [ticket, ...prev]);
        setActiveId(ticket.id);
        setForm(EMPTY_FORM);
        onTicketCreated?.(ticket);
    };

    const closeTicket = () => {
        if (!activeTicket) return;
        const at = Date.now();
        setTickets((prev) =>
            prev.map((t) =>
                t.id === activeTicket.id
                    ? {
                        ...t,
                        status: 'closed',
                        updatedAt: at,
                        messages: [
                            ...t.messages,
                            { id: uid(), from: 'system', text: 'Chat closed. Closed chats still count toward this month’s limit.', at },
                        ],
                    }
                    : t,
            ),
        );
        setConfirmClose(false);
    };

    const sendMessage = async (e) => {
        e?.preventDefault();
        const text = reply.trim();
        if (!text || !activeTicket || activeTicket.status === 'closed' || sending) return;

        const ticketId = activeTicket.id;
        appendMessage(ticketId, { id: uid(), from: 'seller', text, at: Date.now() });
        setReply('');

        if (!onSendMessage) return;
        setSending(true);
        try {
            const answer = await onSendMessage({ ticketId, tab: activeTicket.tab, text });
            if (answer) appendMessage(ticketId, { id: uid(), from: 'agent', text: answer, at: Date.now() });
        } catch {
            appendMessage(ticketId, {
                id: uid(),
                from: 'system',
                text: 'Your message could not be delivered. Check your connection and send it again.',
                at: Date.now(),
            });
        } finally {
            setSending(false);
        }
    };

    const onComposerKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) sendMessage(e);
    };

    /* ---------- render ---------- */
    const threadOpen = activeId !== null;
    const tabStyle = { '--tone': tab.tone, '--tone-soft': tab.soft };
    const TabIcon = tab.Icon;

    return (
        <section className={styles.wrap} aria-label="Zailio seller support">
            {/* Title */}
            <div className={styles.topBar}>
                <h2 className={styles.pageTitle}><FiLifeBuoy /> Seller support</h2>
                <p className={styles.pageSub}>
                    Chat with the Zailio team about your store. Each new chat uses one of your {monthlyLimit} monthly tickets,
                    and replies inside a chat are free.
                </p>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={`${styles.statCard} ${styles.statQuota}`}>
                    <span className={`${styles.statIcon} ${styles.iconIndigo}`}><FiMessageSquare /></span>
                    <div className={styles.statMain}>
                        <span className={styles.statLabel}>Tickets left this month</span>
                        <strong className={styles.statValue}>
                            {remaining}<small> / {monthlyLimit}</small>
                        </strong>
                        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={monthlyLimit} aria-valuenow={used} aria-label="Tickets used">
                            <span className={`${styles.barFill} ${remaining === 0 ? styles.barFull : ''}`} style={{ width: `${usedPct}%` }} />
                        </div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconGreen}`}><FiClock /></span>
                    <div>
                        <span className={styles.statLabel}>Open chats</span>
                        <strong className={styles.statValue}>{openCount}</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconGray}`}><FiCheckCircle /></span>
                    <div>
                        <span className={styles.statLabel}>Closed chats</span>
                        <strong className={styles.statValue}>{closedCount}</strong>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <span className={`${styles.statIcon} ${styles.iconAmber}`}><FiCalendar /></span>
                    <div>
                        <span className={styles.statLabel}>Quota resets on</span>
                        <strong className={`${styles.statValue} ${styles.statDate}`}>{fmtResetDate()}</strong>
                    </div>
                </div>
            </div>

            {/* Workspace: topics | chats | conversation */}
            <div className={`${styles.shell} ${threadOpen ? styles.threadOpen : ''}`} style={tabStyle}>
                {/* Topics */}
                <nav className={styles.nav} aria-label="Support topics">
                    <p className={styles.navHead}>Topics</p>
                    <div
                        className={styles.tabs}
                        role="tablist"
                        aria-label="Support topics"
                        aria-orientation="vertical"
                        onKeyDown={onTabKeyDown}
                    >
                        {TABS.map((t, i) => {
                            const count = tickets.filter((x) => x.tab === t.id).length;
                            const selected = t.id === activeTab;
                            const Icon = t.Icon;
                            return (
                                <button
                                    key={t.id}
                                    ref={(el) => (tabRefs.current[i] = el)}
                                    id={`support-tab-${t.id}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    aria-controls="support-panel"
                                    tabIndex={selected ? 0 : -1}
                                    className={`${styles.tab} ${selected ? styles.tabActive : ''}`}
                                    style={{ '--tone': t.tone, '--tone-soft': t.soft }}
                                    onClick={() => selectTab(t.id)}
                                >
                                    <span className={styles.tabIcon} aria-hidden="true"><Icon /></span>
                                    <span className={styles.tabLabel}>{t.label}</span>
                                    {count > 0 && <span className={styles.badge}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* Chat list */}
                <aside
                    id="support-panel"
                    role="tabpanel"
                    aria-labelledby={`support-tab-${activeTab}`}
                    className={styles.list}
                >
                    <div className={styles.listHead}>
                        <span className={styles.listIcon} aria-hidden="true"><TabIcon /></span>
                        <div className={styles.listHeadText}>
                            <h3 className={styles.listTitle}>{tab.label} chats</h3>
                            <p className={styles.listHint}>{tab.hint}</p>
                        </div>
                    </div>

                    <div className={styles.listActions}>
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={() => setActiveId('new')}
                            disabled={remaining === 0}
                        >
                            <FiPlus /> New chat
                        </button>
                    </div>

                    {remaining === 0 && (
                        <p className={styles.limitNote} role="status">
                            <FiAlertCircle />
                            <span>
                                You have used all {monthlyLimit} tickets this month. You can still reply in open chats, and
                                new tickets unlock on {fmtResetDate()}.
                            </span>
                        </p>
                    )}

                    {tabTotal > 0 && (
                        <div className={styles.listTools}>
                            <label className={styles.search}>
                                <FiSearch aria-hidden="true" />
                                <input
                                    type="search"
                                    className={styles.searchInput}
                                    placeholder="Search chats"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    aria-label="Search chats"
                                />
                            </label>
                            <div className={styles.seg} role="group" aria-label="Filter by status">
                                {STATUS_FILTERS.map((s) => (
                                    <button
                                        key={s.value}
                                        type="button"
                                        className={`${styles.segBtn} ${statusFilter === s.value ? styles.segOn : ''}`}
                                        aria-pressed={statusFilter === s.value}
                                        onClick={() => setStatusFilter(s.value)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tabTickets.length === 0 ? (
                        <div className={styles.emptyList}>
                            <FiInbox className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>
                                {tabTotal === 0 ? `No ${tab.label.toLowerCase()} chats yet` : 'No chats match'}
                            </p>
                            <p className={styles.emptyText}>
                                {tabTotal === 0 ? 'Start a chat and it will show up here.' : 'Try a different search or filter.'}
                            </p>
                        </div>
                    ) : (
                        <ul className={styles.tickets}>
                            {tabTickets.map((t) => {
                                const last = t.messages[t.messages.length - 1];
                                return (
                                    <li key={t.id}>
                                        <button
                                            type="button"
                                            className={`${styles.ticket} ${t.id === activeId ? styles.ticketActive : ''}`}
                                            onClick={() => setActiveId(t.id)}
                                            aria-current={t.id === activeId ? 'true' : undefined}
                                        >
                                            <span className={styles.ticketTop}>
                                                <span className={styles.ticketSubject}>{t.subject}</span>
                                                <span className={`${styles.status} ${t.status === 'closed' ? styles.statusClosed : styles.statusOpen}`}>
                                                    {t.status === 'closed' ? 'Closed' : 'Open'}
                                                </span>
                                            </span>
                                            <span className={styles.ticketPreview}>{last.text}</span>
                                            <span className={styles.ticketMeta}>
                                                {t.ref} · {fmtDay(t.updatedAt)}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>

                {/* Conversation */}
                <div className={styles.thread}>
                    {activeId === null && (
                        <div className={styles.placeholder}>
                            <span className={styles.placeholderIcon} aria-hidden="true"><TabIcon /></span>
                            <p className={styles.emptyTitle}>Pick a chat or start a new one</p>
                            <p className={styles.emptyText}>
                                Each new chat uses 1 of your {monthlyLimit} monthly tickets. Replies inside a chat are free.
                            </p>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={() => setActiveId('new')}
                                disabled={remaining === 0}
                            >
                                <FiPlus /> New {tab.label.toLowerCase()} chat
                            </button>
                        </div>
                    )}

                    {activeId === 'new' && (
                        <form className={styles.newForm} onSubmit={createTicket}>
                            <div className={styles.threadHead}>
                                <button type="button" className={styles.backBtn} onClick={() => setActiveId(null)} aria-label="Back to chats">
                                    <FiChevronLeft />
                                </button>
                                <div className={styles.threadInfo}>
                                    <h3 className={styles.threadTitle}>New {tab.label.toLowerCase()} chat</h3>
                                    <p className={styles.threadSub}>This will use 1 of your {remaining} remaining tickets.</p>
                                </div>
                            </div>

                            <div className={styles.formScroll}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formBody}>
                                        <label className={styles.field}>
                                            <span className={styles.label}>Subject</span>
                                            <input
                                                className={styles.input}
                                                type="text"
                                                maxLength={SUBJECT_MAX}
                                                value={form.subject}
                                                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                                placeholder="Short summary of the issue"
                                                required
                                            />
                                            <small className={styles.counter}>{form.subject.length} / {SUBJECT_MAX}</small>
                                        </label>

                                        <label className={styles.field}>
                                            <span className={styles.label}>Message</span>
                                            <textarea
                                                className={`${styles.input} ${styles.textarea}`}
                                                rows={8}
                                                maxLength={MESSAGE_MAX}
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                placeholder={tab.placeholder}
                                                required
                                            />
                                            <small className={styles.counter}>{form.message.length} / {MESSAGE_MAX}</small>
                                        </label>

                                        <div className={styles.formActions}>
                                            <button type="button" className={styles.ghostBtn} onClick={() => setActiveId(null)}>
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className={styles.primaryBtn}
                                                disabled={remaining === 0 || !form.subject.trim() || !form.message.trim()}
                                            >
                                                <FiSend /> Start chat
                                            </button>
                                        </div>
                                    </div>

                                    <aside className={styles.tips}>
                                        <p className={styles.tipsTitle}><FiInfo /> For a faster answer</p>
                                        <ul className={styles.tipsList}>
                                            {TIPS.map((tip) => (
                                                <li key={tip}>{tip}</li>
                                            ))}
                                        </ul>
                                        <p className={styles.tipsNote}>We usually reply within 24 hours.</p>
                                    </aside>
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTicket && (
                        <>
                            <div className={styles.threadHead}>
                                <button type="button" className={styles.backBtn} onClick={() => setActiveId(null)} aria-label="Back to chats">
                                    <FiChevronLeft />
                                </button>
                                <div className={styles.threadInfo}>
                                    <h3 className={styles.threadTitle}>{activeTicket.subject}</h3>
                                    <p className={styles.threadSub}>
                                        {activeTicket.ref} · {tab.label} · Started {fmtDay(activeTicket.createdAt)}
                                    </p>
                                </div>
                                <span className={`${styles.status} ${activeTicket.status === 'closed' ? styles.statusClosed : styles.statusOpen}`}>
                                    {activeTicket.status === 'closed' ? 'Closed' : 'Open'}
                                </span>
                                {activeTicket.status === 'open' &&
                                    (confirmClose ? (
                                        <span className={styles.confirm}>
                                            <span className={styles.confirmText}>Close this chat?</span>
                                            <button type="button" className={styles.dangerBtn} onClick={closeTicket}>Yes, close</button>
                                            <button type="button" className={styles.ghostBtn} onClick={() => setConfirmClose(false)}>Keep open</button>
                                        </span>
                                    ) : (
                                        <button type="button" className={styles.ghostBtn} onClick={() => setConfirmClose(true)}>
                                            <FiX /> Close chat
                                        </button>
                                    ))}
                            </div>

                            <div className={styles.messages} role="log" aria-live="polite" aria-label="Conversation">
                                {activeTicket.messages.map((m) => (
                                    <div key={m.id} className={`${styles.msg} ${styles[`msg_${m.from}`]}`}>
                                        <p className={styles.bubble}>{m.text}</p>
                                        {m.from !== 'system' && (
                                            <span className={styles.time}>
                                                {m.from === 'agent' ? 'Zailio support, ' : ''}
                                                {fmtTime(m.at)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {sending && (
                                    <div className={`${styles.msg} ${styles.msg_agent}`} aria-hidden="true">
                                        <p className={`${styles.bubble} ${styles.typing}`}><i /><i /><i /></p>
                                    </div>
                                )}
                                <div ref={endRef} />
                            </div>

                            {activeTicket.status === 'closed' ? (
                                <p className={styles.closedBar}>
                                    <FiLock /> This chat is closed. Start a new chat if you need more help.
                                </p>
                            ) : (
                                <form className={styles.composer} onSubmit={sendMessage}>
                                    <textarea
                                        ref={composerRef}
                                        className={`${styles.input} ${styles.composerInput}`}
                                        rows={1}
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={onComposerKeyDown}
                                        placeholder="Write a message"
                                        aria-label="Write a message"
                                    />
                                    <button type="submit" className={styles.primaryBtn} disabled={!reply.trim() || sending}>
                                        <FiSend /> <span className={styles.sendText}>Send</span>
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}