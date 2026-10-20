// components/TabNavigation.jsx
'use client';

import { memo } from 'react';
import styles from './css/tab.module.css';

const TabNavigation = memo(({ activeTab, setActiveTab }) => (
    <div className={styles.tab_navigation}>
        {['basic', 'details', 'media', 'pricing', 'extras', 'attachments', 'upload'].map(tab => (
            <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
            >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
        ))}
    </div>
));

export default TabNavigation;