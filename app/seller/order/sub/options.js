'use client';
import styles from './css/options.module.css';


const Options = ({ activeTab, setActiveTab }) => {

    return (
        <div className={styles.orderTabs}>
            <div
                className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                onClick={() => setActiveTab('pending')}
            >
                Pending
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'confirmed' ? styles.active : ''}`}
                onClick={() => setActiveTab('confirmed')}
            >
                Confirmed
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'pickup' ? styles.active : ''}`}
                onClick={() => setActiveTab('pickup')}
            >
                Pickup
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'processing' ? styles.active : ''}`}
                onClick={() => setActiveTab('processing')}
            >
                Processing
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
                onClick={() => setActiveTab('completed')}
            >
                Completed
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'uc' ? styles.active : ''}`}
                onClick={() => setActiveTab('uc')}
            >
                User Cancelled
            </div>
            <div
                className={`${styles.tab} ${activeTab === 'sc' ? styles.active : ''}`}
                onClick={() => setActiveTab('sc')}
            >
                Seller Cancelled
            </div>
        </div>
    );
};

export default Options;