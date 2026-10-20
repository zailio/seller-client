'use client';
import styles from './css/shade_loading.module.css';
import { ImSpinner2 } from 'react-icons/im';

export default function ShadeLoading() {

    return (
        <div className={styles.fullbg}>
            <div className={styles.smooth_loading}>
                <ImSpinner2 className={styles.spinner} size={40} style={{
                    color: '#fff'
                }} />
            </div>
        </div>
    )
}