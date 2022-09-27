import React, { PropsWithChildren } from 'react';
import styles from './index.module.css';

export function MenuButton({children}: PropsWithChildren) {
  return <button className={styles.container}>
    {children}
  </button>
}
