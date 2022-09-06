import { addCleanupFn } from "../cleanup";
import { Class, detour, findChildKeyInObject, findClassByMethod } from "../utils";

export let Vector2: Class;
export let GameRenderer: Class;
export let PlayerRenderer: Class;
export let Settings: Class;
export let Menu: Class
export let Header: Class;
export let MapObjectHolder: Class;
export let SnakeBodyConfig: Class;
export let GameClass1: Class; // FIXME: naming
export let GameInstance: Class;

export let gameInstance: any;
export let gameInstanceCtx: any;
export let gameInstanceCtxKey: any;
export let gameInstanceMapObjectHolderKey: any;
export let gameInstanceMapObjectHolderObjsKey: any;
export let gameInstanceClass1Key: any;
export let lastGameRenderCtx: any;

let onGameInitialize: (gameRenderCtx: any, gameRenderArgs: any)=>any;
let onGameBeforeGameRender: (gameRenderCtx: any, gameRenderArgs: any)=>any;
let onGameBeforePlayerRender: (playerRenderCtx: any, playerRenderArgs: any)=>any;

export const setOnGameInitialize = (handler: typeof onGameInitialize) => onGameInitialize = handler;
export const setOnGameBeforeGameRender = (handler: typeof onGameBeforeGameRender) => onGameBeforeGameRender = handler;
export const setOnGameBeforePlayerRender = (handler: typeof onGameBeforePlayerRender) => onGameBeforePlayerRender = handler;

let initialized = false;
let gameRenderStarted = false;

export function setupGame() {
  const start = Date.now();
  Vector2 = findClassByMethod('clone', 0, x => x.includes('(this.x,this.y)'));
  GameRenderer = findClassByMethod('render', 2, x => x.includes('this.context.fillRect(0,0,this.context.canvas.width,this.context.canvas.height);'));
  PlayerRenderer = findClassByMethod('render', 3, x => x.includes('RIGHT') && x.includes('DOWN'));
  Settings = findClassByMethod('toString', 0, x => x.includes('v=10,color='));
  Menu = findClassByMethod('update', 0, x => x.includes('this.isVisible()') && x.includes('settings'));
  Header = findClassByMethod(/.*/, 1, x => x.includes('images/icons/material'));
  MapObjectHolder = findClassByMethod('shuffle', 1, () => true);
  SnakeBodyConfig = findClassByMethod('reset', 0, x => x.includes('"RIGHT"') && x.includes('this.direction') && x.includes('.push(new'));
  GameClass1 = findClassByMethod('reset', 0, x => x.includes('.push([])') && x.includes(`new ${Vector2.name}(0,0)`))
  const end = Date.now();
  console.log('[GSM] Game hooks class by function took', end-start, 'ms');

  /*console.log('Vector2 class:', Vector2.name);
  console.log('GameRenderer class:', GameRenderer.name);
  console.log('PlayerRenderer class:', PlayerRenderer.name);
  console.log('Settings class:', Settings.name);
  console.log('Menu class:', Menu.name);
  console.log('Header class:', Header.name);
  console.log('MapObjectHolder class:', MapObjectHolder.name);
  console.log('SnakeBodyConfig class:', SnakeBodyConfig.name);
  console.log('GameClass1 class:', GameClass1.name);*/

  const revertOnGameRenderDetour = detour(GameRenderer.prototype, 'render', function (...args: any) {
    gameRenderStarted = true;
    lastGameRenderCtx = this;

    if (!initialized) {
      initialized = true;
      console.log('[GSM] Game initialized by game render hook');

      const instanceKey = findChildKeyInObject(this, x => x.ticks !== undefined && x.settings !== undefined && x.menu !== undefined);
      gameInstance = this[instanceKey];
      GameInstance = gameInstance.constructor;
      gameInstanceCtxKey = findChildKeyInObject(gameInstance, x => x.direction !== undefined && x.settings !== undefined);
      gameInstanceCtx = gameInstance[gameInstanceCtxKey];
      gameInstanceMapObjectHolderKey = findChildKeyInObject(gameInstance, x => x instanceof MapObjectHolder);
      gameInstanceMapObjectHolderObjsKey = MapObjectHolder.prototype.shuffle.toString().match(/this\.(\w+)\.length/)?.[1];
      if (!gameInstanceMapObjectHolderObjsKey) throw new Error('[GSM] Failed to find object holder objs key!');
      gameInstanceClass1Key = findChildKeyInObject(gameInstance, x => x instanceof GameClass1);

      console.log('[GSM] Game instance:', gameInstance);

      onGameInitialize?.(this, args);
    }
    onGameBeforeGameRender?.(this, args);
  });

  const revertOnPlayerRenderDetour = detour(PlayerRenderer.prototype, 'render', function (...args: any) {
    if (gameRenderStarted) {
      gameRenderStarted = false;
      onGameBeforePlayerRender?.(this, args);
    }
  });

  addCleanupFn(revertOnGameRenderDetour);
  addCleanupFn(revertOnPlayerRenderDetour);
}
