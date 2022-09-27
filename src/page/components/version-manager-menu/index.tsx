import React, { PropsWithChildren } from 'react';
import { MenuButton } from '../menu-button';
import { MenuContainer } from '../menu-container';
import { MenuSelect } from '../menu-select';
import { MenuTitle } from '../menu-title';
import styles from './index.module.css';

export function VersionManagerMenu() {
  return <div className={styles.container}>
    <MenuTitle>Version Manager</MenuTitle>
    <MenuSelect></MenuSelect>
    <MenuButton>Switch</MenuButton>
  </div>
}
