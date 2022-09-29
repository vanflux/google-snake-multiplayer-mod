import React from 'react';
import { menuContainerUIHook } from '../../game-hooks/menu-container-ui-hook';
import { MenuButton } from '../../components/menu-button';
import { MenuRow } from '../../components/menu-row';
import { MenuTitle } from '../../components/menu-title';
import styles from './index.module.css';
import { VersionSelect } from '../../components/version-select';
import { QueryClientProvider } from 'react-query';
import { queryClient } from '../../services/react-query';

export function VersionManagerMenu() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.container}>
        <MenuTitle>Version Manager</MenuTitle>
        <VersionSelect></VersionSelect>
        <MenuRow>
          <MenuButton>Switch</MenuButton>
          <MenuButton onClick={() => menuContainerUIHook.setMenu(-1)}>Back</MenuButton>
        </MenuRow>
      </div>
    </QueryClientProvider>
  );
}
