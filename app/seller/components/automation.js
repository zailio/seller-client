'use client';

import { useState, useEffect } from 'react';
import styles from './css/automation.module.css';

export default function BetaTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleRegister = () => {
    setIsLoading(true);

    setTimeout(() => {
      setShowError(true);
      setIsLoading(false);

      const timer = setTimeout(() => {
        setShowError(false);
      }, 4000);

      return () => clearTimeout(timer);
    }, 1500);
  };

  return (
    <div className={styles.bd}>
      <div className={styles.container}>
        <h1 className={styles.title}>Beta Testing Program</h1>

        <div className={styles.betaMessage}>
          This feature is only available for beta testers.
        </div>

        <button
          className={styles.button}
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? 'Checking access...' : 'Register as Beta Tester'}
        </button>

        {showError && (
          <div className={`${styles.errorMessage} ${showError ? styles.show : ''}`}>
            There was a problem with your account. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
};