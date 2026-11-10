'use client';

import { useMemo } from 'react';
import { useOverview, Attention, overviewStyles as styles } from '../_shared/overview/parts';

// Compact strip shown above the existing seller dashboard.
export default function SellerAttentionStrip({ auth, session, onNavigate }) {
    const creds = useMemo(() => ({ auth, session }), [auth, session]);
    const { overview } = useOverview(creds);
    if (!overview) return null;
    return (
        <div className={styles.stripWrap}>
            <Attention overview={overview} onNavigate={onNavigate} />
        </div>
    );
}
