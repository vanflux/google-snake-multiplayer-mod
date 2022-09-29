import React, { PropsWithChildren } from 'react';
import styles from './index.module.css';

export function MenuRow({children}: PropsWithChildren) {
  return <div className={styles.container}>
    {children}
  </div>
}
