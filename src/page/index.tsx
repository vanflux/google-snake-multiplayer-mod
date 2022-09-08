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
      const DGameEngine = obfuscationHelper.findMethod(x => x.matchRawName('render') && x.hasParamCount(2) && x.contains(/"visible":"hidden"/) && x.contains(/\.render\(a,b\)/)).parent();
      const GameEngine = DGameEngine.get();
      
      const DVector2 = obfuscationHelper.findMethod(x => x.matchRawName('clone') && x.hasParamCount(0) && x.contains(/\(this\.x,this\.y\)/)).parent();
      const Vector2 = DVector2.get();
      
      const DBoardRenderer = obfuscationHelper.findMethod(x => x.matchRawName('render') && x.hasParamCount(2) && x.contains(/this\.context\.fillRect\(0,0,this\.context\.canvas\.width,this\.context\.canvas\.height\);/)).parent();
      const BoardRenderer = DBoardRenderer.get();
      
      const DPlayerRenderer = obfuscationHelper.findMethod(x => x.matchRawName('render') && x.hasParamCount(3) && x.contains(/RIGHT/) && x.contains(/DOWN/)).parent();
      const PlayerRenderer = DPlayerRenderer.get();
      
      const DSettings = obfuscationHelper.findMethod(x => x.matchRawName('toString') && x.hasParamCount(0) && x.contains(/v=10,color=/)).parent();
      const Settings = DSettings.get();
      
      const DMenu = obfuscationHelper.findMethod(x => x.matchRawName('update') && x.hasParamCount(0) && x.contains(/this\.isVisible\(\)/) && x.contains(/settings/)).parent();
      const Menu = DMenu.get();
      
      const DHeader = obfuscationHelper.findMethod(x => x.matchRawName(/.*/) && x.hasParamCount(1) && x.contains(/images\/icons\/material/)).parent();
      const Header = DHeader.get();
      
      const DMapObjectHolder = obfuscationHelper.findMethod(x => x.matchRawName('shuffle') && x.hasParamCount(1)).parent();
      const MapObjectHolder = DMapObjectHolder.get();
      
      const DSnakeBodyConfig = obfuscationHelper.findMethod(x => x.matchRawName('reset') && x.hasParamCount(0) && x.contains(/"RIGHT"/) && x.contains(/this\.direction/) && x.contains(/\.push\(new/)).parent();
      const SnakeBodyConfig = DSnakeBodyConfig.get();
      
      const DGameClass1 = obfuscationHelper.findMethod(x => x.matchRawName('reset') && x.hasParamCount(0) && x.contains(/\.push\(\[\]\)/) && x.contains(new RegExp(`new ${Vector2.name}\\(0,0\\)`))).parent();
      const GameClass1 = DGameClass1.get();
      
      const DAssetRenderer = obfuscationHelper.findMethod(x => x.matchRawName('render') && x.hasParamCount(5) && x.contains(/this\.context\.drawImage/) && x.contains(/this\.context\.translate/) && x.contains(/this\.context\.rotate/)).parent();
      const AssetRenderer = DAssetRenderer.get();
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
