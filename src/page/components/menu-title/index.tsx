import React, { PropsWithChildren } from 'react';
import styles from './index.module.css';

export function MenuTitle({children}: PropsWithChildren) {
  return <p className={styles.container}>{children}</p>
}
