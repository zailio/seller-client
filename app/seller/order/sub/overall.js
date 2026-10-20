'use client';
import styles from './css/overall.module.css';


const Overall = ({ overall }) => {
    if (!overall) overall = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        compleated: 0,
        uc: 0,
        sc: 0
    }
    return (
        <div className={styles.statsContainer}>
            <div className={`${styles.statCard} ${styles.pendingOrders}`}>
                <div className={styles.statValue}>{overall.pending}</div>
                <div className={styles.statLabel}>Pending</div>
            </div>
            <div className={`${styles.statCard} ${styles.pendingOrders}`}>
                <div className={styles.statValue}>{overall.confirmed}</div>
                <div className={styles.statLabel}>Confirmed</div>
            </div>
            <div className={`${styles.statCard} ${styles.trackedOrders}`}>
                <div className={styles.statValue}>{overall.processing}</div>
                <div className={styles.statLabel}>Processing</div>
            </div>
            <div className={`${styles.statCard} ${styles.completedOrders}`}>
                <div className={styles.statValue}>{overall.compleated}</div>
                <div className={styles.statLabel}>Completed Orders</div>
            </div>
            <div className={`${styles.statCard} ${styles.cancelledOrders}`}>
                <div className={styles.statValue}>{overall.uc}</div>
                <div className={styles.statLabel}>User Cancelled</div>
            </div>
            <div className={`${styles.statCard} ${styles.cancelledOrders}`}>
                <div className={styles.statValue}>{overall.sc}</div>
                <div className={styles.statLabel}>Seller Cancelled</div>
            </div>
        </div>
    );
};

export default Overall;