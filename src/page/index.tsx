import React from 'react';
import { addCleanupFn, cleanup } from "./cleanup";
import { ExtraHeader } from './components/extra-header';
import { createOtherGameInstance, renderOtherGameInstance, updateOtherGameInstance } from "./game-instance-sharing";
import { gameInstance, gameInstanceCtx, setOnGameBeforeGameRender, setOnGameBeforePlayerRender, setOnGameInitialize, Settings, setupGame } from "./hooks/game-hook";
import { setupHeaderUI } from "./hooks/header-ui-hook";
import { deserializeGameInstance, serializeGameInstance } from "./serializers/game-instance-serializer";
import { vfSerialize } from './serializers/vf-serializer';
import { setupSocket, socket } from "./socket";

export async function pageLoadedEntry() {
  if (window.cleanup) window.cleanup();
  window.cleanup = cleanup;

  let others = new Map<string, {otherInstance: any, otherRenderer: any}>();
  let lastDataSend = 0;

  // For testing purposes
  function runInLoop() {
    const mapping: any = {
      RIGHT: 'DOWN',
      DOWN: 'LEFT',
      LEFT: 'UP',
      UP: 'RIGHT',
    };
    const id = setInterval(() => {
      if ((window as any).dontLoop) return;
      gameInstanceCtx.direction = mapping[gameInstanceCtx.direction] || 'RIGHT';
      [...document.querySelectorAll('div > h2')].find(x => x.textContent === 'Play')?.parentElement?.click();
    }, Math.random() * 50 + 500);
    return () => clearInterval(id);
  }

  function main() {
    console.log('[GSM] Starting...');

    // Setup game hooks and multiplayer logic
    setupGame();
    setOnGameInitialize(gameRenderCtx => {
      addCleanupFn(runInLoop());
      
      // Setup ui hooks
      setupHeaderUI(<ExtraHeader></ExtraHeader>);

      console.log('>>>>>>>>>', //vfSerialize(gameInstance));
      console.log('>>>>>>>>>', //JSON.stringify(vfSerialize(gameInstance)).length);

      // Setup communication
      setupSocket();
      socket.on('connect', () => {
        console.log('[GSM] Connected to the server!');
        others.clear();
      });
      socket.on('other_connect', ({id}) => {
        console.log('[GSM] Other connect', id);
        const other = createOtherGameInstance();
        others.set(id, other);
      });
      socket.on('other_disconnect', ({id}) => {
        console.log('[GSM] Other disconnect', id);
        others.delete(id);
      });
      socket.on('other_data', ({id, data: serializedData}) => {
        const other = others.get(id);
        if (!other) return;
        const data = deserializeGameInstance(serializedData);
        updateOtherGameInstance(other.otherInstance, data);
      });
    });
    setOnGameBeforeGameRender((gameRenderCtx, [renderPart]) => {
      try {
        if (lastDataSend === undefined || Date.now() - lastDataSend > 20) {
          const serializedData = serializeGameInstance(renderPart);
          socket.emit('data', serializedData);
          lastDataSend = Date.now();
        }
      } catch (exc) {
        console.error('[GSM] Game before game render error', exc);
      }
    });
    setOnGameBeforePlayerRender((playerRenderCtx, [,,resolution]) => {
      others.forEach(({otherRenderer, otherInstance}) => {
        try {
          renderOtherGameInstance(otherRenderer, otherInstance, resolution);
        } catch (exc) {
          console.error('[GSM] Other game instance render error', exc);
        }
      });
    });
  }

  main();
}
