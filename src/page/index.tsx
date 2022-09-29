import React from 'react';
import { CanvasOverlay } from './components/canvas-overlay';
import { ExtraHeader } from './components/extra-header';
import { canvasUIHook } from './game-hooks/canvas-ui-hook';
import { gameLogicHooks } from './game-hooks/game-logic-hook';
import { headerUIHook } from './game-hooks/header-ui-hook';
import { linkerHelper } from './utils/linker';
import { multiplayer } from './multiplayer';
import { cleanup } from './utils/cleanup';
import { snakeLoop } from './utils/snake-loop';
import { menuContainerUIHook } from './game-hooks/menu-container-ui-hook';
import { VersionManagerMenu } from './components/version-manager-menu';
import { MenuButton } from './components/menu-button';

export async function pageLoadedEntry() {
  if (window.cleanup) window.cleanup();
  window.cleanup = cleanup;

  function main() {
    try {
      console.log('[GSM] Starting...');

      linkerHelper.setup();
      gameLogicHooks.on('initialize', () => {
        headerUIHook.setup(<ExtraHeader></ExtraHeader>);
        canvasUIHook.setup(<CanvasOverlay></CanvasOverlay>);
        menuContainerUIHook.setup([
          <VersionManagerMenu />,
        ], (
        <MenuButton onClick={() => menuContainerUIHook.setMenu(0)}>GSM</MenuButton>
        ));
        multiplayer.setup();
        snakeLoop.setup();
      });
      gameLogicHooks.setup();
    } catch (exc) {
      console.error('[GSM] Main error:', exc);
    }
  }

  main();
}
