import React from 'react';
import styles from './index.module.css';

export interface MenuSelectItem<T> {
  name: string;
  data: T;
}

export interface MenuSelectProps<T> {
  onChange?: (item?: T) => void;
  value?: T;
  items?: MenuSelectItem<T>[]
}

export function MenuSelect<T>({onChange, value, items}: MenuSelectProps<T>) {
  return <select
    value={items?.findIndex(item => item.data === value)}
    onChange={e => onChange?.(items?.[parseInt(e.target.value)]?.data)}
    className={styles.container}
  >
    {value === undefined && <option label="Select some version"></option>}
    {items?.map((item, i) => <option key={i} value={i}>{item.name}</option>)}
  </select>
}
