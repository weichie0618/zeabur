import styles from './page.module.css';

export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>LINE 服務連結</h1>
        <div className={styles.statusMessage}>
          <p>準備中，請稍候...</p>
          <div className={styles.loadingSpinner}></div>
        </div>
      </div>
    </div>
  );
} 