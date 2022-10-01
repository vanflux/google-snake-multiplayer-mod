import React, { useCallback, useState } from 'react';
import { menuContainerUIHook } from '../../game-hooks/menu-container-ui-hook';
import { MenuButton } from '../../components/menu-button';
import { MenuRow } from '../../components/menu-row';
import { MenuTitle } from '../../components/menu-title';
import styles from './index.module.css';
import { VersionSelect } from '../../components/version-select';
import { QueryClientProvider } from 'react-query';
import { queryClient } from '../../services/react-query';

export function VersionManagerMenu() {
  const [tag, setTag] = useState<string>();
  const [switching, setSwitching] = useState(false);
  
  const switchVersion = useCallback(() => {
    if (tag === undefined) return;
    setSwitching(true);
    const url = `https://github.com/vanflux/google-snake-multiplayer-mod/releases/download/${tag}/gsm-mod.js`;
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }, [tag]);

  const back = () => menuContainerUIHook.setMenu(-1);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.container}>
        <MenuTitle>Version Manager</MenuTitle>
        <VersionSelect tag={tag} onChange={setTag}></VersionSelect>
        <MenuRow>
          <MenuButton disabled={switching} onClick={switchVersion}>Switch</MenuButton>
          <MenuButton disabled={switching} onClick={back}>Back</MenuButton>
        </MenuRow>
      </div>
    </QueryClientProvider>
  );
}
