import React from 'react';
import styles from './index.module.css';

export function MenuSelect() {
  return <select className={styles.container}>
    <option value={'a1'}>A1</option>
    <option value={'a2'}>A2</option>
    <option value={'a3'}>A3</option>
    <option value={'a4'}>A4</option>
  </select>
}
