import { gameInstance, lastBoardRenderCtx } from "../game-hooks/game-logic-hook";
import { findChildKeysInObject } from "../game-hooks/utils";

export type GameSharing = ReturnType<typeof createGameSharing>;
export type OtherGameSharing = ReturnType<GameSharing['createOther']>;
export type ThisGameSharing = ReturnType<GameSharing['getThisData']>;

const MAX_LATENCY_COMPENSATION = 1000;
const LATENCY_COMPENSATION_AMPLIFIER = 1.1;

export function createGameSharing() {
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
      gameClass1: gameInstance.gameClass1, // A important class for rendering snake
      mapObjectHolder: gameInstance.mapObjectHolder, // By default, the map objects are shared between gameInstance and others
    });
    const otherRenderer: any = new PlayerRenderer(otherInstance, settings, lastBoardRenderCtx.snakeBodyConfig);

    const updateData = (serializedData: any) => {
      const oldEyeColor = otherInstance?.snakeBodyConfig?.color1;

      otherInstance.xaa = serializedData.xaa;
      otherInstance.saa = serializedData.saa;
      otherInstance.headState = serializedData.headState;
      otherInstance.snakeBodyConfig.headState = serializedData.snakeBodyConfig.headState;
      otherInstance.snakeBodyConfig.bodyPoses.length = serializedData.snakeBodyConfig.bodyPoses.length;
      serializedData.snakeBodyConfig.bodyPoses.forEach((x: any, i: number) => otherInstance.snakeBodyConfig.bodyPoses[i] = new Vector2(x.x, x.y));
      otherInstance.snakeBodyConfig.tailPos = new Vector2(serializedData.snakeBodyConfig.tailPos.x, serializedData.snakeBodyConfig.tailPos.y);
      otherInstance.snakeBodyConfig.direction = serializedData.snakeBodyConfig.direction;
      otherInstance.snakeBodyConfig.oldDirection = serializedData.snakeBodyConfig.oldDirection;
      otherInstance.snakeBodyConfig.directionChanged = serializedData.snakeBodyConfig.directionChanged;
      otherInstance.snakeBodyConfig.deathHeadState = serializedData.snakeBodyConfig.deathHeadState;
      otherInstance.snakeBodyConfig.color1 = serializedData.snakeBodyConfig.color1;
      otherInstance.snakeBodyConfig.color2 = serializedData.snakeBodyConfig.color2;
      if (serializedData.mapObjectHolder?.objs) {
        otherInstance.mapObjectHolder.objs.length = serializedData.mapObjectHolder.objs.length;
        serializedData.mapObjectHolder.objs.forEach((x: any, i: number) => {
          const proxied = createCollectableProxy(otherInstance.mapObjectHolder.objs[i]);
          proxied.f1 = new Vector2(x.f1.x, x.f1.y);
          proxied.f2 = x.f2;
          proxied.f3 = x.f3;
          proxied.f4 = x.f4;
          proxied.f5 = new Vector2(x.f5.x, x.f5.y);
          proxied.f6 = new Vector2(x.f6.x, x.f6.y);
          proxied.f7 = x.f7;
          proxied.f8 = x.f8;
        });
      }
      
      const newEyeColor = otherInstance?.snakeBodyConfig?.color1;
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
      const renderPart = ((Date.now() - otherInstance.latency) - otherInstance.xaa) / otherInstance.saa
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
    const newObjs = gameInstance?.mapObjectHolder?.objs;
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
    return {
      xaa: gameInstance.xaa,
      saa: gameInstance.saa,
      snakeBodyConfig: {
        bodyPoses: gameInstance.snakeBodyConfig.bodyPoses.map((x: any) => ({ x: x.x, y: x.y })),
        tailPos: ({ x: gameInstance.snakeBodyConfig.tailPos.x, y: gameInstance.snakeBodyConfig.tailPos.y }),
        direction: gameInstance.snakeBodyConfig.direction,
        oldDirection: gameInstance.snakeBodyConfig.oldDirection,
        directionChanged: gameInstance.snakeBodyConfig.directionChanged,
        deathHeadState: gameInstance.snakeBodyConfig.deathHeadState, // Death head state
        color1: gameInstance.snakeBodyConfig.color1, // Snake color 1
        color2: gameInstance.snakeBodyConfig.color2, // Snake color 2
        settings: {
          //oa: 10,
        },
      },
      headState: gameInstance.headState,
      mapObjectHolder: checkObjsChanged() ? {
        // Conditionally send map objects (only if changed)
        objs: gameInstance?.mapObjectHolder?.objs?.map((x: any) => {
          const proxiedObj = createCollectableProxy(x);
          return {
            f1: { x: proxiedObj.f1.x, y: proxiedObj.f1.y },
            f2: proxiedObj.f2,
            f3: proxiedObj.f3,
            f4: proxiedObj.f4,
            f5: { x: proxiedObj.f5.x, y: proxiedObj.f5.y },
            f6: { x: proxiedObj.f6.x, y: proxiedObj.f6.y },
            f7: proxiedObj.f7,
            f8: proxiedObj.f8,
          } as Collectable;
        }),
      } : undefined,
    };
  };

  const updateLatency = (newLatency: number) => {
    latency = newLatency;
  };
  
  const getLatency = () => latency;

  return {createOther, getThisData, updateLatency, getLatency};
}
