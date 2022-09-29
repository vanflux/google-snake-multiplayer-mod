import React, { ReactNode } from 'react';
import styles from './index.module.css';

export interface MenuButtonProps {
  children: ReactNode;
  onClick?: () => void;
}

export function MenuButton({children, onClick}: MenuButtonProps) {
  return <button onClick={onClick} className={styles.container}>
    {children}
  </button>
}
