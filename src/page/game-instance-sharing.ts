import { GameInstance, gameInstance, gameInstanceClass1Key, gameInstanceCtxKey, gameInstanceMapObjectHolderKey, gameInstanceMapObjectHolderObjsKey, Header, lastGameRenderCtx, Menu, PlayerRenderer, Settings, SnakeBodyConfig, Vector2 } from "./hooks/game-hook";

export function createOtherGameInstance() {
  const div = () => document.createElement('div');
  const canvas = () => document.createElement('canvas');
  const settings = new Settings(div());
  const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
  const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());

  const otherInstance: any = new GameInstance(settings, menu, header);

  Object.assign(otherInstance, {
    [gameInstanceClass1Key]: gameInstance[gameInstanceClass1Key], // A important class for rendering snake
    [gameInstanceMapObjectHolderKey]: gameInstance[gameInstanceMapObjectHolderKey], // By default, the map objects are shared between gameInstance and others
  });
  
  const otherRenderer: any = new PlayerRenderer(otherInstance, settings, lastGameRenderCtx[gameInstanceCtxKey]);
  console.log('[GSM] Other game instance:', otherInstance);

  return {otherRenderer, otherInstance}
}

export function renderOtherGameInstance(otherRenderer: any, otherInstance: any, resolution: any) {
  otherRenderer.render(otherInstance.renderPart, true, resolution);
}

export function getShareableGameInstance(renderPart: number) {
  return {
    ...{
      ...gameInstance,
      [gameInstanceMapObjectHolderKey]: {
        [gameInstanceMapObjectHolderObjsKey]: gameInstance[gameInstanceMapObjectHolderKey][gameInstanceMapObjectHolderObjsKey],
      },
    },
    renderPart,
  };
}
