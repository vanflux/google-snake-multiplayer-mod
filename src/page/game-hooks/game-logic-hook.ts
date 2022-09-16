import { addCleanupFn } from "../utils/cleanup";
import { escapeRegex } from "../utils/escape-regex";
import { detour, findChildKeyInObject, obfuscationHelper } from "./utils";

// This entire file is bizarre, it makes all necessary hooks to the game

export let gameInstance: any;
export let lastBoardRenderCtx: any;

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
  .findMethod('render', 3, [/RIGHT/, /DOWN/]).parent().setName('PlayerRenderer')
  .link();
  
  obfuscationHelper
  .findMethod('render', 2, [/this\.context\.fillRect\(0,0,this\.context\.canvas\.width,this\.context\.canvas\.height\);/]).parent().setName('BoardRenderer')
  .findField(new RegExp(`new ${escapeRegex(PlayerRenderer.name)}\\(this\\.[\\w\\$]+,this.settings,this.([\\w\\$]+)\\)`)).setName('snakeBodyConfig').parent()
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
  .findField(/this\.([\w\$]+)\.length-1/).setName('objs').parent()
  .link();
  
  obfuscationHelper
  .findMethod('reset', 0, [/"RIGHT"/, /this\.direction/, /\.push\(new/]).parent().setName('SnakeBodyConfig')
  .findField(new RegExp(`this\\.([\\w\\$]+)\\.push\\(new ${escapeRegex(Vector2.name)}\\(Math\\.floor\\(`)).setName('bodyPoses').parent()
  .findField(/this\.([\w\$]+)=this\.[\w\$]+\[2\]/).setName('tailPos').parent()
  .findField(/this\.direction="NONE";this\.([\w\$]+)="RIGHT"/).setName('oldDirection').parent()
  .findField(/this\.[\w\$]+="NONE";this\.([\w\$]+)=!1/).setName('directionChanged').parent()
  .findField(/this\.[\w\$]+=\[\];this\.([\w\$]+)=0/).setName('deathHeadState').parent()
  .findField(/this\.([\w\$]+)=[\w\$]+\[0\]\[0\]/).setName('color1').parent()
  .findField(/this\.([\w\$]+)=[\w\$]+\[0\]\[1\]/).setName('color2').parent()
  .link();
  
  obfuscationHelper
  .findMethod('reset', 0, [/\.push\(\[\]\)/, new RegExp(`new ${escapeRegex(Vector2.name)}\\(0,0\\)`)]).parent().setName('GameClass1')
  .link();
  
  obfuscationHelper
  .findMethod('render', 5, [/this\.context\.drawImage/, /this\.context\.translate/, /this\.context\.rotate/]).parent().setName('AssetRenderer')
  .link();

  obfuscationHelper
  .findMethod('tick', 0, []).parent().setName('GameInstance')
  .findField(/this.([\w\$]+)\|\|this\.[\w\$]+/).setName('headState').parent()
  .findField(/this\.([\w\$]+)>=this\.[\w\$]+;\)this\.[\w\$]+\+=this.[\w\$]+/).setName('xaa').parent()
  .findField(/this\.[\w\$]+>=this\.([\w\$]+);\)this\.[\w\$]+\+=this.[\w\$]+/).setName('saa').parent()
  .findField(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(GameClass1.name)}\\(`)).setName('gameClass1').parent()
  .findField(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(SnakeBodyConfig.name)}\\(`)).setName('snakeBodyConfig').parent()
  .findField(new RegExp(`this\\.([\\w\\$]+)=new ${escapeRegex(MapObjectHolder.name)}\\(`)).setName('mapObjectHolder').parent()
  .link();

  obfuscationHelper
  .findFunction(/.*/, [3,4], [/\.getImageData\(0,0/]).setName('changeAssetColor')
  .link();
  
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
