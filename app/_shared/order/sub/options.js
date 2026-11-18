'use client';
import styles from './css/options.module.css';

// Tabs where orders wait on the seller (accept, print label / dispatch, hand over).
// They show a count badge so the seller sees there is work to do.
const TABS = [
    { key: 'pending', label: 'Pending', actionNeeded: true },
    { key: 'confirmed', label: 'Confirmed', actionNeeded: true },
    { key: 'pickup', label: 'Pickup', actionNeeded: true },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
    { key: 'uc', label: 'User Cancelled' },
    { key: 'sc', label: 'Seller Cancelled' },
];

const Options = ({ activeTab, setActiveTab, overall }) => {
    return (
        <div className={styles.orderTabs} role="tablist">
            {TABS.map(({ key, label, actionNeeded }) => {
                const count = actionNeeded ? Number(overall?.[key]) || 0 : 0;
                return (
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === key}
                        key={key}
                        className={`${styles.tab} ${activeTab === key ? styles.active : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        {label}
                        {count > 0 && (
                            <span className={styles.badge} aria-label={`${count} need action`}>
                                {count > 99 ? '99+' : count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default Options;
