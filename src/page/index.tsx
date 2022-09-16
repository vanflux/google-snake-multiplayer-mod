import React from 'react';
import { CanvasOverlay } from './components/canvas-overlay';
import { ExtraHeader } from './components/extra-header';
import { canvasUIHook } from './game-hooks/canvas-ui-hook';
import { setOnGameInitialize, setupGameLogicHooks } from './game-hooks/game-logic-hook';
import { headerUIHook } from './game-hooks/header-ui-hook';
import { findClassByMethod, obfuscationHelper } from './game-hooks/utils';
import { multiplayer } from './multiplayer';
import { cleanup } from './utils/cleanup';
import { snakeLoop } from './utils/snake-loop';

export async function pageLoadedEntry() {
  if (window.cleanup) window.cleanup();
  window.cleanup = cleanup;

  function main() {
    try {
      console.log('[GSM] Starting...');

      obfuscationHelper.setup();
      setupGameLogicHooks();
      setOnGameInitialize(_ => {
        headerUIHook.setup(<ExtraHeader></ExtraHeader>);
        canvasUIHook.setup(<CanvasOverlay></CanvasOverlay>)
        multiplayer.setup();
        snakeLoop.setup();
      });
    } catch (exc) {
      console.error('[GSM] Main error:', exc);
    }
  }

  main();
}
