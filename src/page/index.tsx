import React from 'react';
import { addCleanupFn, cleanup } from "./cleanup";
import { ExtraHeader } from './components/extra-header';
import { createOtherGameInstance, getShareableGameInstance, renderOtherGameInstance } from "./game-instance-sharing";
import { AssetRenderer, changeAssetColor, gameInstanceCtx, gameInstanceCtxEyeColorKey, gameInstanceCtxKey, setOnGameBeforeGameRender, setOnGameBeforePlayerRender, setOnGameInitialize, setupGame } from "./hooks/game-hook";
import { setupHeaderUI } from "./hooks/header-ui-hook";
import { ArrayMapper } from './serializers/mappers/array-mapper';
import { ObjectMapper } from './serializers/mappers/object-mapper';
import { SimpleMapper } from './serializers/mappers/simple-mapper';
import { Vector2Mapper } from './serializers/mappers/vector2-mapper';
import { buildVfSerializer, VFSerializer } from './serializers/vf-serializer';
import { setupSocket, socket } from "./socket";
import { findChildKeysInObject } from './utils';

export async function pageLoadedEntry() {
  if (window.cleanup) window.cleanup();
  window.cleanup = cleanup;

  let bytesSentStartTime = 0;
  let bytesSent = 0;
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

    let serializer: VFSerializer;

    setupGame();
    setOnGameInitialize(_ => {
      addCleanupFn(runInLoop());

      serializer = buildVfSerializer([
        new SimpleMapper(),
        new ArrayMapper(),
        new ObjectMapper(),
        new Vector2Mapper(),
      ]);
      
      // Setup ui hooks
      setupHeaderUI(<ExtraHeader></ExtraHeader>);

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

        // Deserialize and checks if snake eye color has changed
        // If the color changes we need to regenerate assets
        const oldEyeColor = other.otherInstance?.[gameInstanceCtxKey]?.[gameInstanceCtxEyeColorKey];
        serializer.deserialize(serializedData, other.otherInstance);
        const newEyeColor = other.otherInstance?.[gameInstanceCtxKey]?.[gameInstanceCtxEyeColorKey];
        if (newEyeColor !== oldEyeColor) {
          // Regenerate all assets based on eye color
          findChildKeysInObject(other.otherRenderer, x => x instanceof AssetRenderer).forEach(key => {
            changeAssetColor(other.otherRenderer[key], '#5282F2', newEyeColor);
          });
        }
      });
    });
    setOnGameBeforeGameRender((_, [renderPart]) => {
      // Send player data to others
      try {
        if (lastDataSend === undefined || Date.now() - lastDataSend > 20) {
          const serializedResult = serializer.serialize(getShareableGameInstance(renderPart));
          bytesSent += JSON.stringify(serializedResult.data).length;
          if (Date.now() - bytesSentStartTime >= 1000) {
            console.log('Bytes sent:', bytesSent);
            bytesSentStartTime = Date.now();
            bytesSent = 0;
          }
          socket.emit('data', serializedResult.data);
          lastDataSend = Date.now();
        }
      } catch (exc) {
        console.error('[GSM] Game before game render error', exc);
      }
    });
    setOnGameBeforePlayerRender((_, [,,resolution]) => {
      // Render other players
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
