import React, { ReactNode } from 'react';
import styles from './index.module.css';

export interface MenuButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export function MenuButton({children, disabled, onClick}: MenuButtonProps) {
  return <button onClick={onClick} disabled={disabled} className={`${styles.container} ${disabled && styles.disabled}`}>
    {children}
  </button>
}
