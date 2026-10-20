"use client";

import styles from "./css/warehouse.module.css";

export default function WarehousePage() {

    return (
        <div className={styles.container}>
            <div className={styles.loaderWrapper}>
                <div className={styles.loader}></div>
                <p className={styles.loadingText}>Loading warehouse data...</p>
            </div>
        </div>
    );
}
