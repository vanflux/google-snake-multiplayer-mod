import { addCleanupFn } from "../utils/cleanup";
import { escapeRegex } from "../utils/escape-regex";
import { linkerHelper } from "../utils/linker";
import { detour, findChildKeyInObject } from "./utils";

// This entire file is bizarre, it makes all necessary hooks to the game

export let gameInstance: GameInstance;
export let lastBoardRenderCtx: BoardRenderer;

let onGameInitialize: (lastBoardRenderCtx: BoardRenderer, boardRenderArgs: any)=>any;
let onGameBeforeBoardRender: (boardRenderCtx: BoardRenderer, boardRenderArgs: any)=>any;
let onGameBeforeMainPlayerRender: (playerRenderCtx: PlayerRenderer, playerRenderArgs: any)=>any;

export const setOnGameInitialize = (handler: typeof onGameInitialize) => onGameInitialize = handler;
export const setOnGameBeforeBoardRender = (handler: typeof onGameBeforeBoardRender) => onGameBeforeBoardRender = handler;
export const setOnGameBeforeMainPlayerRender = (handler: typeof onGameBeforeMainPlayerRender) => onGameBeforeMainPlayerRender = handler;

let initialized = false;
let boardRenderStarted = false;

export function setupGameLogicHooks() {
  const start = Date.now();

  // Collectable proxy
  const [collPosition, collAnimationStep, collType, collAppearing, collVelocity, collF6, collIsPoisoned, collIsGhost] =
    linkerHelper.findValues(/\{([\w\$]+):new [\w\$]+\(Math\.floor\(3.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*,[\s\r\n\t]*([\w\$]+):.*\}/, 8, 'function');
  window.createCollectableProxy = linkerHelper.createProxyFactory({
    maps: {
      position: { rawName: collPosition },
      animationStep: { rawName: collAnimationStep },
      type: { rawName: collType },
      appearing: { rawName: collAppearing },
      velocity: { rawName: collVelocity },
      f6: { rawName: collF6 },
      isPoisoned: { rawName: collIsPoisoned },
      isGhost: { rawName: collIsGhost },
    },
  });

  window.changeAssetColor = linkerHelper.findFunction(/.*/, [3,4], [/\.getImageData\(0,0/]);

  window.GameEngine = linkerHelper.findClassByMethod('render', [2], [/"visible":"hidden"/, /\.render\(a,b\)/]);
  window.Vector2 = linkerHelper.findClassByMethod('clone', [0], [/\(this\.x,this\.y\)/]);
  window.PlayerRenderer = linkerHelper.findClassByMethod('render', [3], [/RIGHT/, /DOWN/]);
  window.BoardRenderer = linkerHelper.findClassByMethod('render', [2], [/this\.context\.fillRect\(0,0,this\.context\.canvas\.width,this\.context\.canvas\.height\);/]);
  window.Settings = linkerHelper.findClassByMethod('toString', [0], [/v=10,color=/]);
  window.Menu = linkerHelper.findClassByMethod('update', [0], [/this\.isVisible\(\)/, /settings/]);
  window.Header = linkerHelper.findClassByMethod(/.*/, [1], [/images\/icons\/material/]);
  window.MapObjectHolder = linkerHelper.findClassByMethod('shuffle', [1], []);
  window.SnakeBodyConfig = linkerHelper.findClassByMethod('reset', [0], [/"RIGHT"/, /this\.direction/, /\.push\(new/]);
  window.GameClass1 = linkerHelper.findClassByMethod('reset', [0], [/\.push\(\[\]\)/, new RegExp(`new ${escapeRegex(Vector2.name)}\\(0,0\\)`)]);
  window.AssetRenderer = linkerHelper.findClassByMethod('render', [5], [/this\.context\.drawImage/, /this\.context\.translate/, /this\.context\.rotate/]);
  window.GameInstance = linkerHelper.findClassByMethod('tick', [0], []);

  linkerHelper.proxyProp(BoardRenderer, 'canvasCtx', linkerHelper.findValue(new RegExp(`new ${escapeRegex(PlayerRenderer.name)}\\(this\\.[\\w\\$]+,this.settings,this.([\\w\\$]+)\\)`), 'class'));
  linkerHelper.proxyProp(MapObjectHolder, 'objs', linkerHelper.findValue(/this\.([\w\$]+)\.length-1/, 'method', MapObjectHolder));
  linkerHelper.proxyProp(SnakeBodyConfig, 'bodyPoses', linkerHelper.findValue(new RegExp(`this\\.([\\w\\$]+)\\.push\\(new ${escapeRegex(Vector2.name)}\\(Math\\.floor\\(`), 'method', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'tailPos', linkerHelper.findValue(/this\.([\w\$]+)=this\.[\w\$]+\[2\]/, 'method', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'oldDirection', linkerHelper.findValue(/this\.direction="NONE";this\.([\w\$]+)="RIGHT"/, 'method', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'directionChanged', linkerHelper.findValue(/this\.[\w\$]+="NONE";this\.([\w\$]+)=!1/, 'method', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'deathHeadState', linkerHelper.findValue(/this\.[\w\$]+=\[\];this\.([\w\$]+)=0/, 'method', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'color1', linkerHelper.findValue(/this\.([\w\$]+)=[\w\$]+\[0\]\[0\]/, 'class', SnakeBodyConfig));
  linkerHelper.proxyProp(SnakeBodyConfig, 'color2', linkerHelper.findValue(/this\.([\w\$]+)=[\w\$]+\[0\]\[1\]/, 'class', SnakeBodyConfig));
  linkerHelper.proxyProp(GameInstance, 'headState', linkerHelper.findValue(/\(this.([\w\$]+)\|\|this\.[\w\$]+\)/, 'method', GameInstance));
  linkerHelper.proxyProp(GameInstance, 'xaa', linkerHelper.findValue(/this\.([\w\$]+)>=this\.[\w\$]+;\)this\.[\w\$]+\+=this.[\w\$]+/, 'method', GameInstance));
  linkerHelper.proxyProp(GameInstance, 'saa', linkerHelper.findValue(/this\.[\w\$]+>=this\.([\w\$]+);\)this\.[\w\$]+\+=this.[\w\$]+/, 'method', GameInstance));
  linkerHelper.proxyProp(GameInstance, 'gameClass1', linkerHelper.findValue(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(GameClass1.name)}\\(`), 'class', GameInstance));
  linkerHelper.proxyProp(GameInstance, 'snakeBodyConfig', linkerHelper.findValue(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(SnakeBodyConfig.name)}\\(`), 'class', GameInstance));
  linkerHelper.proxyProp(GameInstance, 'mapObjectHolder', linkerHelper.findValue(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(MapObjectHolder.name)}\\(`), 'class', GameInstance));

  const end = Date.now();
  console.log('[GSM] Game hooks class by function took', end-start, 'ms');

  const revertOnBoardRenderDetour = detour(BoardRenderer.prototype, 'render', function (...args: any) {
    boardRenderStarted = true;
    lastBoardRenderCtx = this;

    if (!initialized) {
      initialized = true;
      console.log('[GSM] Game initialized by game render hook');
      const instanceKey = findChildKeyInObject(this, x => x instanceof GameInstance);
      gameInstance = this[instanceKey];
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
