import { addCleanupFn } from "../utils/cleanup";
import { detour, findChildKeyInObject, findChildKeysInObject, findClassByMethod, obfuscationHelper } from "./utils";

// This entire file is bizarre, it makes all necessary hooks to the game

export let gameInstance: any;
export let gameInstanceSnake: any;
export let gameInstanceSnakeKey: any;
export let gameInstanceSnakeEyeColorKey: any;
export let gameInstanceMapObjectHolderKey: any;
export let gameInstanceMapObjectHolderObjsKey: any;
export let gameInstanceXaKey: any; // FIXME: good naming
export let gameInstanceSaKey: any; // FIXME: good naming
export let gameEngineGameLoopFnKey: any;
export let gameInstanceClass1Key: any;
export let lastBoardRenderCtx: any;
export let changeAssetColorKey: any;
export let changeAssetColor: any;

let onGameInitialize: (lastBoardRenderCtx: any, boardRenderArgs: any)=>any;
let onGameBeforeBoardRender: (boardRenderCtx: any, boardRenderArgs: any)=>any;
let onGameBeforeMainPlayerRender: (playerRenderCtx: any, playerRenderArgs: any)=>any;

export const setOnGameInitialize = (handler: typeof onGameInitialize) => onGameInitialize = handler;
export const setOnGameBeforeBoardRender = (handler: typeof onGameBeforeBoardRender) => onGameBeforeBoardRender = handler;
export const setOnGameBeforeMainPlayerRender = (handler: typeof onGameBeforeMainPlayerRender) => onGameBeforeMainPlayerRender = handler;

let initialized = false;
let boardRenderStarted = false;

export function setupGameLogicHooks() {
  const start = Date.now();

  obfuscationHelper
  .findMethod('render', 2, [/"visible":"hidden"/, /\.render\(a,b\)/]).parent().setName('GameEngine')
  .findMethod('render').setName('render').parent()
  .link();
  
  obfuscationHelper
  .findMethod('clone', 0, [/\(this\.x,this\.y\)/]).parent().setName('Vector2')
  .link();
  
  obfuscationHelper
  .findMethod('render', 2, [/this\.context\.fillRect\(0,0,this\.context\.canvas\.width,this\.context\.canvas\.height\);/]).parent().setName('BoardRenderer')
  .link();
  
  obfuscationHelper
  .findMethod('render', 3, [/RIGHT/, /DOWN/]).parent().setName('PlayerRenderer')
  .link();
  
  obfuscationHelper
  .findMethod('toString', 0, [/v=10,color=/]).parent().setName('Settings')
  .link();
  
  obfuscationHelper
  .findMethod('update', 0, [/this\.isVisible\(\)/, /settings/]).parent().setName('Menu')
  .link();

  obfuscationHelper
  .findMethod(/.*/, 1, [/images\/icons\/material/]).parent().setName('Header')
  .link();
  
  obfuscationHelper
  .findMethod('shuffle', 1, []).parent().setName('MapObjectHolder')
  .link();
  
  obfuscationHelper
  .findMethod('reset', 0, [/"RIGHT"/, /this\.direction/, /\.push\(new/]).parent().setName('SnakeBodyConfig')
  .link();
  
  obfuscationHelper
  .findMethod('reset', 0, [/\.push\(\[\]\)/, new RegExp(`new ${Vector2.name}\\(0,0\\)`)]).parent().setName('GameClass1')
  .link();
  
  obfuscationHelper
  .findMethod('render', 5, [/this\.context\.drawImage/, /this\.context\.translate/, /this\.context\.rotate/]).parent().setName('AssetRenderer')
  .link();

  const end = Date.now();
  console.log('[GSM] Game hooks class by function took', end-start, 'ms');

  const revertOnBoardRenderDetour = detour(BoardRenderer.prototype, 'render', function (...args: any) {
    boardRenderStarted = true;
    lastBoardRenderCtx = this;

    if (!initialized) {
      initialized = true;
      console.log('[GSM] Game initialized by game render hook');

      const instanceKey = findChildKeyInObject(this, x => x.ticks !== undefined && x.settings !== undefined && x.menu !== undefined);
      gameInstance = this[instanceKey];
      window.GameInstance = gameInstance.constructor; // TODO: use deobfuscation helper
      gameInstanceSnakeKey = findChildKeyInObject(gameInstance, x => x.direction !== undefined && x.settings !== undefined);
      gameInstanceSnake = gameInstance[gameInstanceSnakeKey];
      gameInstanceSnakeEyeColorKey = findChildKeysInObject(gameInstanceSnake, x => typeof x === 'string' && !!x.match(/\#[a-fA-F0-9]{3,6}/))[0];
      gameInstanceMapObjectHolderKey = findChildKeyInObject(gameInstance, x => x instanceof MapObjectHolder);
      gameInstanceMapObjectHolderObjsKey = MapObjectHolder.prototype.shuffle.toString().match(/this\.(\w+)\.length/)?.[1];
      const xaSaRegex = new RegExp(`\\(\\w+\\-this\\.${instanceKey}\\.(\\w+)\\)\\/this\\.${instanceKey}\\.(\\w+)`);
      gameEngineGameLoopFnKey = findChildKeyInObject(GameEngine.prototype, x => typeof x === 'function' && x.toString().match(xaSaRegex));
      [, gameInstanceXaKey, gameInstanceSaKey] = GameEngine.prototype[gameEngineGameLoopFnKey].toString().match(xaSaRegex);
      if (!gameInstanceMapObjectHolderObjsKey) throw new Error('[GSM] Failed to find object holder objs key!');
      gameInstanceClass1Key = findChildKeyInObject(gameInstance, x => x instanceof GameClass1);
      changeAssetColorKey = findChildKeyInObject(window, x => typeof x === 'function' && x.toString().includes('.getImageData(0,0'));
      changeAssetColor = window[changeAssetColorKey];
      
      console.log('[GSM] gameInstanceSnakeKey:', gameInstanceSnakeKey);
      console.log('[GSM] gameInstanceMapObjectHolderKey:', gameInstanceMapObjectHolderKey);
      console.log('[GSM] gameInstanceClass1Key:', gameInstanceClass1Key);
      console.log('[GSM] gameInstanceXaKey:', gameInstanceXaKey);
      console.log('[GSM] gameInstanceSaKey:', gameInstanceSaKey);

      console.log('[GSM] Game instance:', gameInstance);

      try {
        onGameInitialize?.(this, args)
      } catch(exc) {
        console.error('[GSM] Game initialize error:', exc);
      }
    }
    try {
      onGameBeforeBoardRender?.(this, args)
    } catch(exc) {
      console.error('[GSM] Game before game render error:', exc);
    }
  });

  const revertOnPlayerRenderDetour = detour(PlayerRenderer.prototype, 'render', function (...args: any) {
    if (boardRenderStarted) {
      boardRenderStarted = false;
      try {
        onGameBeforeMainPlayerRender?.(this, args)
      } catch(exc) {
        console.error('[GSM] Game before main player render error:', exc);
      }
    }
  });

  addCleanupFn(revertOnBoardRenderDetour);
  addCleanupFn(revertOnPlayerRenderDetour);
}
