import styles from './css/confirmationDialog.module.css';
import { useStore } from '../context/store';

const Alert = () => {
    const { currentAlert, genAlert } = useStore();
    if (!currentAlert) return;

    const onClose = () => {
        if (currentAlert.onClose) currentAlert.onClose();
        genAlert(false);
    };
    const onAgree = () => {
        if (currentAlert.onConfirm) currentAlert.onConfirm();
        genAlert(false);
    };
    return (
        <div className={styles.dialogOverlay} onClick={onClose}>
            <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.dialogTitle}>{currentAlert.title}</h3>
                {currentAlert.isHtml
                    ? <div className={styles.dialogMessage} dangerouslySetInnerHTML={{ __html: currentAlert.message }} />
                    : <p className={styles.dialogMessage}>{currentAlert.message}</p>
                }
                <div className={styles.buttonsContainer}>
                    <button
                        className={`${styles.button} ${styles.cancelButton}`}
                        onClick={onClose}
                    >
                        {currentAlert.cancelText}
                    </button>
                    <button
                        className={`${styles.button} ${styles.confirmButton}`}
                        onClick={onAgree}
                    >
                        {currentAlert.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Alert;