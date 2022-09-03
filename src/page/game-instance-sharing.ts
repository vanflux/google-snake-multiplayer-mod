import { gameInstance, gameInstanceCtxKey, Header, lastGameRenderCtx, Menu, PlayerRenderer, Settings } from "./hooks/game-hook";

export function createOtherGameInstance() {
  const otherInstance: any = {};
  const otherRenderer: any = new PlayerRenderer(otherInstance, lastGameRenderCtx.settings, lastGameRenderCtx[gameInstanceCtxKey]);

  const div = () => document.createElement('div');
  const canvas = () => document.createElement('canvas');
  const settings = new Settings(div());
  const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
  const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());

  const aux = {
    ...gameInstance,
    settings,
    menu,
    header,
    [gameInstanceCtxKey]: document.createElement('canvas').getContext('2d'),
  };

  Object.assign(otherInstance, aux);
  console.log('[GSM] Other game instance:', otherInstance);

  return {otherRenderer, otherInstance}
}

export function updateOtherGameInstance(otherInstance: any, data: any) {
  for (const key in data) {
    if (typeof otherInstance[key] === 'object' && !Array.isArray(otherInstance[key])) {
      for (const subKey in gameInstance[key]) {
        otherInstance[key][subKey] = data[key][subKey] ?? otherInstance[key][subKey] ?? gameInstance[key][subKey];
      }
    } else {
      otherInstance[key] = data[key] ?? otherInstance[key];
    }
  }
}

export function renderOtherGameInstance(otherRenderer: any, otherInstance: any, resolution: any) {
  otherRenderer.render(otherInstance.renderPart, true, resolution);
}
