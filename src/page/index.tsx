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
    console.log('[GSM] Starting...');

    obfuscationHelper.setup();
    const start = Date.now();

    try {
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
      .findMethod('update', 0, [/this\.isVisible\(\)/, /settings/]).parent()
      .setName('Menu')
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
    } 
    catch (exc) {
      console.error(exc);
    }
    const end = Date.now();
    console.log('took', end-start);

    /*setupGameLogicHooks();
    setOnGameInitialize(_ => {
      headerUIHook.setup(<ExtraHeader></ExtraHeader>);
      canvasUIHook.setup(<CanvasOverlay></CanvasOverlay>)
      multiplayer.setup();
      snakeLoop.setup();
    });*/
  }

  main();
}
