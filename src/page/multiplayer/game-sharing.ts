import { AssetRenderer, changeAssetColor, gameInstance, GameInstance, gameInstanceClass1Key, gameInstanceCtxEyeColorKey, gameInstanceCtxKey, gameInstanceMapObjectHolderKey, gameInstanceMapObjectHolderObjsKey, Header, lastGameRenderCtx, Menu, PlayerRenderer, Settings } from "../game-hooks/game-logic-hook";
import { findChildKeysInObject } from "../game-hooks/utils";
import { buildSerializer } from "./serializer";
import { ArrayMapper, ObjectMapper, SimpleMapper, Vector2Mapper } from "./serializer/mappers";

export type GameSharing = ReturnType<typeof createGameSharing>;
export type OtherGameSharing = ReturnType<GameSharing['createOther']>;
export type ThisGameSharing = ReturnType<GameSharing['getThisData']>;

export function createGameSharing() {
  const serializer = buildSerializer([
    new SimpleMapper(),
    new ArrayMapper(),
    new ObjectMapper(),
    new Vector2Mapper(),
  ]);

  const createOther = () => {
    const div = () => document.createElement('div');
    const canvas = () => document.createElement('canvas');
    const settings = new Settings(div());
    const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div()); // Emulate elements
    const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
    const otherInstance = Object.assign(new GameInstance(settings, menu, header), {
      [gameInstanceClass1Key]: gameInstance[gameInstanceClass1Key], // A important class for rendering snake
      [gameInstanceMapObjectHolderKey]: gameInstance[gameInstanceMapObjectHolderKey], // By default, the map objects are shared between gameInstance and others
    });
    const otherRenderer: any = new PlayerRenderer(otherInstance, settings, lastGameRenderCtx[gameInstanceCtxKey]);

    const updateData = (serializedData: any) => {
      const oldEyeColor = otherInstance?.[gameInstanceCtxKey]?.[gameInstanceCtxEyeColorKey];
      serializer.deserialize(serializedData, otherInstance); // This line is the CORE of update
      const newEyeColor = otherInstance?.[gameInstanceCtxKey]?.[gameInstanceCtxEyeColorKey];
      if (newEyeColor !== oldEyeColor) {
        // Regenerate all assets based on eye color
        findChildKeysInObject(otherRenderer, x => x instanceof AssetRenderer).forEach(key => {
          changeAssetColor(otherRenderer[key], '#5282F2', newEyeColor);
        });
      }
    };
    
    const render = (resolution: any) => {
      otherRenderer.render(otherInstance.renderPart, true, resolution);
    };

    return {updateData, render};
  };

  const getThisData = (renderPart: number) => {
    const data = {
      ...{
        ...gameInstance,
        [gameInstanceMapObjectHolderKey]: {
          [gameInstanceMapObjectHolderObjsKey]: gameInstance[gameInstanceMapObjectHolderKey][gameInstanceMapObjectHolderObjsKey],
        },
      },
      renderPart,
    };
    const serializedResult = serializer.serialize(data);
    return serializedResult.data;
  };

  return {createOther, getThisData};
}
