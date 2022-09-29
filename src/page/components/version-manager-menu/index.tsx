import React, { PropsWithChildren } from 'react';
import { menuContainerUIHook } from '../../game-hooks/menu-container-ui-hook';
import { MenuButton } from '../menu-button';
import { MenuRow } from '../menu-row';
import { MenuSelect } from '../menu-select';
import { MenuTitle } from '../menu-title';
import styles from './index.module.css';

export function VersionManagerMenu() {
  return <div className={styles.container}>
    <MenuTitle>Version Manager</MenuTitle>
    <MenuSelect></MenuSelect>
    <MenuRow>
      <MenuButton>Switch</MenuButton>
      <MenuButton onClick={() => menuContainerUIHook.setMenu(-1)}>Back</MenuButton>
    </MenuRow>
  </div>
}
