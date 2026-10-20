import styles from './css/wait.module.css';

export default function Wait({
  className = '',
  text = 'Loading...',
  color = 'inherit',
  ringCount = 3,
  speed = 1.2
}) {
  return (
    <div className={`${styles.loaderWrapper} ${className}`} style={{ color }}>
      <div className={styles.spinner}>
        {[...Array(ringCount)].map((_, i) => (
          <div
            key={i}
            className={styles.spinnerRing}
            style={{
              animationDuration: `${speed}s`,
              borderWidth: `${0.3 + (i * 0.1)}em`
            }}
          />
        ))}
      </div>
      {text && <div className={styles.loaderText}>{text}</div>}
    </div>
  );
}