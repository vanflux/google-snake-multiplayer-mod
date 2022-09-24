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
    const otherRenderer = new PlayerRenderer(otherInstance, settings, lastBoardRenderCtx.canvasCtx);

    const updateData = (serializedData: GameInstance) => {
      const oldEyeColor = otherInstance?.snakeBodyConfig?.color1;

      otherInstance.xaa = serializedData.xaa;
      otherInstance.saa = serializedData.saa;
      otherInstance.headState = serializedData.headState;
      otherInstance.snakeBodyConfig.headState = serializedData.snakeBodyConfig.headState;
      otherInstance.snakeBodyConfig.bodyPoses.length = serializedData.snakeBodyConfig.bodyPoses.length;
      serializedData.snakeBodyConfig.bodyPoses.forEach((x, i) => otherInstance.snakeBodyConfig.bodyPoses[i] = new Vector2(x.x, x.y));
      otherInstance.snakeBodyConfig.tailPos = new Vector2(serializedData.snakeBodyConfig.tailPos.x, serializedData.snakeBodyConfig.tailPos.y);
      otherInstance.snakeBodyConfig.direction = serializedData.snakeBodyConfig.direction;
      otherInstance.snakeBodyConfig.oldDirection = serializedData.snakeBodyConfig.oldDirection;
      otherInstance.snakeBodyConfig.directionChanged = serializedData.snakeBodyConfig.directionChanged;
      otherInstance.snakeBodyConfig.deathHeadState = serializedData.snakeBodyConfig.deathHeadState;
      otherInstance.snakeBodyConfig.color1 = serializedData.snakeBodyConfig.color1;
      otherInstance.snakeBodyConfig.color2 = serializedData.snakeBodyConfig.color2;
      if (serializedData.mapObjectHolder?.objs) {
        otherInstance.mapObjectHolder.objs.length = serializedData.mapObjectHolder.objs.length;
        serializedData.mapObjectHolder.objs.forEach((x, i) => {
          if (!otherInstance.mapObjectHolder.objs[i]) otherInstance.mapObjectHolder.objs[i] = {} as Collectable;
          const proxied = createCollectableProxy(otherInstance.mapObjectHolder.objs[i]);
          proxied.position = new Vector2(x.position.x, x.position.y);
          proxied.animationStep = x.animationStep;
          proxied.type = x.type;
          proxied.appearing = x.appearing;
          proxied.velocity = new Vector2(x.velocity.x, x.velocity.y);
          proxied.f6 = new Vector2(x.f6.x, x.f6.y);
          proxied.isPoisoned = x.isPoisoned;
          proxied.isGhost = x.isGhost;
        });
      }
      
      const newEyeColor = otherInstance?.snakeBodyConfig?.color1;
      if (newEyeColor !== oldEyeColor) {
        // Regenerate all assets based on eye color
        findChildKeysInObject(otherRenderer, x => x instanceof AssetRenderer).forEach(key => {
          changeAssetColor((otherRenderer as any)[key], '#5282F2', newEyeColor);
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

  let oldObjs: Collectable[] = [];
  const checkObjsChanged = () => {
    const newObjs = gameInstance?.mapObjectHolder?.objs;
    if (!newObjs || newObjs.length === 0) return false;
    for (let i = 0; i < newObjs.length; i++) {
      const proxiedNewItem = createCollectableProxy(newObjs[i] || {});
      const proxiedOldItem = createCollectableProxy(oldObjs[i] || {});
      if (proxiedNewItem.appearing !== proxiedOldItem.appearing || proxiedNewItem.position !== proxiedOldItem.position) {
        oldObjs = newObjs?.map(x => ({...x}));
        return true;
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
      },
      headState: gameInstance.headState,
      mapObjectHolder: checkObjsChanged() ? {
        // Conditionally send map objects (only if changed)
        objs: gameInstance?.mapObjectHolder?.objs?.map((x: any) => {
          const proxiedObj = createCollectableProxy(x);
          return {
            position: { x: proxiedObj.position.x, y: proxiedObj.position.y },
            animationStep: proxiedObj.animationStep,
            type: proxiedObj.type,
            appearing: proxiedObj.appearing,
            velocity: { x: proxiedObj.velocity.x, y: proxiedObj.velocity.y },
            f6: { x: proxiedObj.f6.x, y: proxiedObj.f6.y },
            isPoisoned: proxiedObj.isPoisoned,
            isGhost: proxiedObj.isGhost,
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
