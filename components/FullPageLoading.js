import styles from './css/FullPageLoading.module.css';

export default function FullPageLoading({
    showPercentage = false,
    showProgress = false,
    showCancel = false,
    onCancel,
    percentage = 75,
}) {

    return (
        <div className={styles.overlay}>
            {/* Main Spinner */}
            <div className={styles.spinnerContainer}>
                <div className={styles.outerRing}></div>
                <div className={styles.innerRing}></div>
                <div className={styles.centerDot}></div>
            </div>

            {/* Loading Text with Animated Dots */}
            <div className={styles.loadingText}>
                <p className={styles.darkText}>
                    Loading
                </p>
                <div className={styles.dotsContainer}>
                    <div className={styles.dot1}></div>
                    <div className={styles.dot2}></div>
                    <div className={styles.dot3}></div>
                </div>
            </div>

            {/* Optional Progress Bar */}
            {showProgress && (
                <div className={styles.darkProgressContainer}>
                    <div className={styles.progressBar}></div>
                </div>
            )}

            {/* Optional Percentage */}
            {showPercentage && (
                <div className={styles.darkPercentage}>
                    {percentage}%
                </div>
            )}

            {/* Optional Cancel Button */}
            {showCancel && (
                <button
                    className={styles.darkCancelButton}
                    onClick={onCancel}
                >
                    Cancel
                </button>
            )}
        </div>
    );
}