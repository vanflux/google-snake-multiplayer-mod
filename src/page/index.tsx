import React from 'react';
import { ExtraHeader } from './components/extra-header';
import { setOnGameInitialize, setupGameLogicHooks } from './game-hooks/game-logic-hook';
import { setupHeaderUIHooks } from './game-hooks/header-ui-hook';
import { setupMultiplayer } from './multiplayer';
import { cleanup } from './utils/cleanup';
import { setupSnakeLoop } from './utils/snake-loop';

export async function pageLoadedEntry() {
  if (window.cleanup) window.cleanup();
  window.cleanup = cleanup;

  function main() {
    console.log('[GSM] Starting...');

    setupGameLogicHooks();
    setOnGameInitialize(_ => {
      setupHeaderUIHooks(<ExtraHeader></ExtraHeader>);
      setupMultiplayer();
      setupSnakeLoop();
    });
  }

  main();
}
