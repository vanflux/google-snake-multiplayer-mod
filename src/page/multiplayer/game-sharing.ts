import { AssetRenderer, changeAssetColor, gameInstance, GameInstance, gameInstanceClass1Key, gameInstanceSnakeEyeColorKey, gameInstanceSnakeKey, gameInstanceMapObjectHolderKey, gameInstanceMapObjectHolderObjsKey, gameInstanceSaKey, gameInstanceXaKey, Header, lastBoardRenderCtx, Menu, PlayerRenderer, Settings, Vector2 } from "../game-hooks/game-logic-hook";
import { findChildKeysInObject } from "../game-hooks/utils";
import { buildSerializer } from "./serializer";
import { ArrayMapper, ObjectMapper, SimpleMapper, Vector2Mapper } from "./serializer/mappers";

export type GameSharing = ReturnType<typeof createGameSharing>;
export type OtherGameSharing = ReturnType<GameSharing['createOther']>;
export type ThisGameSharing = ReturnType<GameSharing['getThisData']>;

const MAX_LATENCY_COMPENSATION = 1000;
const LATENCY_COMPENSATION_AMPLIFIER = 1.1;

export function createGameSharing() {
  const serializer = buildSerializer([
    new SimpleMapper(),
    new ArrayMapper(),
    new ObjectMapper(),
    new Vector2Mapper(),
  ]);
  let latency = 50;

  const createOther = () => {
    const div = () => document.createElement('div');
    const canvas = () => document.createElement('canvas');
    const settings = new Settings(div());
    const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div()); // Emulate elements
    const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
    const otherInstance = Object.assign(new GameInstance(settings, menu, header), {
      receivedData: false,
      latency: 50,
      [gameInstanceClass1Key]: gameInstance[gameInstanceClass1Key], // A important class for rendering snake
      [gameInstanceMapObjectHolderKey]: gameInstance[gameInstanceMapObjectHolderKey], // By default, the map objects are shared between gameInstance and others
    });
    const otherRenderer: any = new PlayerRenderer(otherInstance, settings, lastBoardRenderCtx[gameInstanceSnakeKey]);

    const updateData = (serializedData: any) => {
      const oldEyeColor = otherInstance?.[gameInstanceSnakeKey]?.[gameInstanceSnakeEyeColorKey];
      serializer.deserialize(serializedData, otherInstance); // This line is the CORE of update
      const newEyeColor = otherInstance?.[gameInstanceSnakeKey]?.[gameInstanceSnakeEyeColorKey];
      if (newEyeColor !== oldEyeColor) {
        // Regenerate all assets based on eye color
        findChildKeysInObject(otherRenderer, x => x instanceof AssetRenderer).forEach(key => {
          changeAssetColor(otherRenderer[key], '#5282F2', newEyeColor);
        });
      }
      checkObjsChanged();
      otherInstance.receivedData = true;
    };

    const updateLatency = (newLatency: number) => {
      otherInstance.latency = Math.min(MAX_LATENCY_COMPENSATION, ((latency / 2) + (newLatency / 2)) * LATENCY_COMPENSATION_AMPLIFIER);
    };
    
    const render = (resolution: any) => {
      const renderPart = ((Date.now() - otherInstance.latency) - otherInstance[gameInstanceXaKey]) / otherInstance[gameInstanceSaKey];
      otherInstance.receivedData && otherRenderer.render(renderPart, true, resolution);
    };

    const update = () => {
      otherInstance.receivedData && otherInstance.update((Date.now() - otherInstance.latency));
    };

    const getLatency = () => otherInstance.latency;

    console.log('[GSM] Other instance:', otherInstance);

    return {updateData, updateLatency, render, update, getLatency};
  };

  let oldObjs: any[] = [];
  const checkObjsChanged = () => {
    const newObjs = gameInstance?.[gameInstanceMapObjectHolderKey]?.[gameInstanceMapObjectHolderObjsKey];
    if (!newObjs || newObjs.length === 0) return false;
    for (let i = 0; i < newObjs.length; i++) {
      const newItem = newObjs[i];
      const oldItem = oldObjs[i];
      for (const key in newItem) {
        if (
          (typeof newItem[key] === 'boolean' && newItem[key] !== oldItem?.[key])
          || (newItem[key] instanceof Vector2 && newItem[key].x !== oldItem?.[key]?.x || newItem[key].y !== oldItem?.[key]?.y)
        ) {
          oldObjs = newObjs?.map((x: any) => ({...x}));
          return true;
        }
      }
    }
    return false;
  };

  const getThisData = () => {
    const data = {
      // Send game instance
      [gameInstanceXaKey]: gameInstance[gameInstanceXaKey],
      [gameInstanceSnakeKey]: gameInstance[gameInstanceSnakeKey],
      Ej: gameInstance.Ej, // Head state

      // Conditionally send map objects (only if changed)
      [gameInstanceMapObjectHolderKey]: checkObjsChanged() ? {
        [gameInstanceMapObjectHolderObjsKey]: gameInstance[gameInstanceMapObjectHolderKey][gameInstanceMapObjectHolderObjsKey],
      } : {},
    };
    const serializedResult = serializer.serialize(data);
    return serializedResult.data;
  };

  const updateLatency = (newLatency: number) => {
    latency = newLatency;
  };
  
  const getLatency = () => latency;

  return {createOther, getThisData, updateLatency, getLatency};
}
