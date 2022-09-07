import { addCleanupFn } from "../utils/cleanup";
import { Class, detour, findChildKeyInObject, findChildKeysInObject, findClassByMethod } from "./utils";

// This entire file is bizarre, it makes all necessary hooks to the game

export let GameEngine: Class;
export let Vector2: Class;
export let BoardRenderer: Class;
export let PlayerRenderer: Class;
export let Settings: Class;
export let Menu: Class
export let Header: Class;
export let MapObjectHolder: Class;
export let SnakeBodyConfig: Class;
export let GameClass1: Class; // FIXME: good naming
export let GameInstance: Class;
export let AssetRenderer: Class;

export let gameInstance: any;
export let gameInstanceCtx: any;
export let gameInstanceCtxKey: any;
export let gameInstanceCtxEyeColorKey: any;
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
let onGameBeforePlayerRender: (playerRenderCtx: any, playerRenderArgs: any)=>any;

export const setOnGameInitialize = (handler: typeof onGameInitialize) => onGameInitialize = handler;
export const setOnGameBeforeBoardRender = (handler: typeof onGameBeforeBoardRender) => onGameBeforeBoardRender = handler;
export const setOnGameBeforePlayerRender = (handler: typeof onGameBeforePlayerRender) => onGameBeforePlayerRender = handler;

let initialized = false;
let boardRenderStarted = false;

export function setupGameLogicHooks() {
  const start = Date.now();
  GameEngine = findClassByMethod('render', 2, x => x.includes('"visible":"hidden"') && x.includes('.render(a,b)'));
  Vector2 = findClassByMethod('clone', 0, x => x.includes('(this.x,this.y)'));
  BoardRenderer = findClassByMethod('render', 2, x => x.includes('this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);'));
  PlayerRenderer = findClassByMethod('render', 3, x => x.includes('RIGHT') && x.includes('DOWN'));
  Settings = findClassByMethod('toString', 0, x => x.includes('v=10,color='));
  Menu = findClassByMethod('update', 0, x => x.includes('this.isVisible()') && x.includes('settings'));
  Header = findClassByMethod(/.*/, 1, x => x.includes('images/icons/material'));
  MapObjectHolder = findClassByMethod('shuffle', 1, () => true);
  SnakeBodyConfig = findClassByMethod('reset', 0, x => x.includes('"RIGHT"') && x.includes('this.direction') && x.includes('.push(new'));
  GameClass1 = findClassByMethod('reset', 0, x => x.includes('.push([])') && x.includes(`new ${Vector2.name}(0,0)`));
  AssetRenderer = findClassByMethod('render', 5, x => x.includes('this.context.drawImage') && x.includes('this.context.translate') && x.includes('this.context.rotate'));

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
      GameInstance = gameInstance.constructor;
      gameInstanceCtxKey = findChildKeyInObject(gameInstance, x => x.direction !== undefined && x.settings !== undefined);
      gameInstanceCtx = gameInstance[gameInstanceCtxKey];
      gameInstanceCtxEyeColorKey = findChildKeysInObject(gameInstanceCtx, x => typeof x === 'string' && !!x.match(/\#[a-fA-F0-9]{3,6}/))[0];
      gameInstanceMapObjectHolderKey = findChildKeyInObject(gameInstance, x => x instanceof MapObjectHolder);
      gameInstanceMapObjectHolderObjsKey = MapObjectHolder.prototype.shuffle.toString().match(/this\.(\w+)\.length/)?.[1];
      const xaSaRegex = new RegExp(`\\(\\w+\\-this\\.${instanceKey}\\.(\\w+)\\)\\/this\\.${instanceKey}\\.(\\w+)`);
      gameEngineGameLoopFnKey = findChildKeyInObject(GameEngine.prototype, x => typeof x === 'function' && x.toString().match(xaSaRegex));
      [, gameInstanceXaKey, gameInstanceSaKey] = GameEngine.prototype[gameEngineGameLoopFnKey].toString().match(xaSaRegex);
      if (!gameInstanceMapObjectHolderObjsKey) throw new Error('[GSM] Failed to find object holder objs key!');
      gameInstanceClass1Key = findChildKeyInObject(gameInstance, x => x instanceof GameClass1);
      changeAssetColorKey = findChildKeyInObject(window, x => typeof x === 'function' && x.toString().includes('.getImageData(0,0'));
      changeAssetColor = window[changeAssetColorKey];
      
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
        onGameBeforePlayerRender?.(this, args)
      } catch(exc) {
        console.error('[GSM] Game before player render error:', exc);
      }
    }
  });

  addCleanupFn(revertOnBoardRenderDetour);
  addCleanupFn(revertOnPlayerRenderDetour);
}
