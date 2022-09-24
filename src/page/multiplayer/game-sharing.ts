// Responsability: Share game instance with other players and sync other player instances

import EventEmitter from "events";
import { gameInstance, lastBoardRenderCtx } from "../game-hooks/game-logic-hook";
import { detour, findChildKeysInObject } from "../game-hooks/utils";
import { addCleanupFn } from "../utils/cleanup";
import { connection } from "./connection";

const MAX_LATENCY_COMPENSATION = 1000;
const LATENCY_COMPENSATION_AMPLIFIER = 1.1;

class GameSharing extends EventEmitter {
  private oldObjs: Collectable[] = [];
  private lastDataSend = 0; // Last data send date
  private lastDirection!: string;

  public others = new Map<string, GameSharingOther>();

  setup() {
    const self = this;
    
    gameInstance.latency = 50;
    
    // Setup communication
    connection.on('connect', () => {
      console.log('[GSM] Connected to the server!');
      this.others.clear();
      this.emit('others_changed', this.others);
    });
    connection.on('other_connect', ({id}) => {
      console.log('[GSM] Other connect', id);
      const other = gameSharing.createOther();
      this.others.set(id, other);
      this.emit('others_changed', this.others);
    });
    connection.on('other_disconnect', ({id}) => {
      console.log('[GSM] Other disconnect', id);
      this.others.delete(id);
      this.emit('others_changed', this.others);
    });
    connection.on('other_data', ({id, data}) => {
      const other = this.others.get(id);
      if (!other) return;
      other.updateData(data);
    });
    connection.on('latency', ({latency}) => {
      gameSharing.updateLatency(latency);
    });
    connection.on('other_latency', ({id, latency}) => {
      const other = this.others.get(id);
      if (!other) return;
      other.updateLatency(latency);
      this.emit('others_changed', this.others);
    });
    
    addCleanupFn(detour(BoardRenderer.prototype, 'render', function () {
      // Send player data to others
      const curDirection = gameInstance.snakeBodyConfig.direction;
      if (self.lastDataSend === undefined || Date.now() - self.lastDataSend > 250 || self.lastDirection !== curDirection) {
        self.lastDataSend = Date.now();
        self.lastDirection = curDirection;
        const serializedData = gameSharing.getThisData();
        connection.send('data', serializedData);
      }
    }));

    addCleanupFn(detour(PlayerRenderer.prototype, 'render', function (a: any, b: any, resolution: any) {
      // Update + render other players
      if (this.instance === gameInstance) {
        self.others.forEach(other => other.update());
        self.others.forEach(other => other.render(resolution));
      }
    }));
  }
  
  checkObjsChanged() {
    const newObjs = gameInstance?.mapObjectHolder?.objs;
    if (!newObjs || newObjs.length === 0) return false;
    for (let i = 0; i < newObjs.length; i++) {
      const proxiedNewItem = createCollectableProxy(newObjs[i] || {});
      const proxiedOldItem = createCollectableProxy(this.oldObjs[i] || {});
      if (proxiedNewItem.appearing !== proxiedOldItem.appearing || proxiedNewItem.position !== proxiedOldItem.position) {
        this.oldObjs = newObjs?.map(x => ({...x}));
        return true;
      }
    }
    return false;
  };
  
  createOther() {
    return new GameSharingOther(this);
  }

  getThisData() {
    return {
      xaa: gameInstance.xaa,
      saa: gameInstance.saa,
      headState: gameInstance.headState,
      lastInvencibilityTime: gameInstance.lastInvencibilityTime,
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
      mapObjectHolder: this.checkObjsChanged() ? {
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

  updateLatency(newLatency: number) {
    gameInstance.latency = newLatency;
  }

  getLatency() {
    return gameInstance.latency;
  }
}

export class GameSharingOther {
  public instance: GameInstance;
  public renderer: PlayerRenderer;

  constructor(private gameSharing: GameSharing) {
    const div = () => document.createElement('div');
    const canvas = () => document.createElement('canvas');
    const settings = new Settings(div());
    const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div()); // Emulate elements
    const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
    this.instance = Object.assign(new GameInstance(settings, menu, header), {
      receivedData: false,
      latency: 50,
      lastInvencibilityTime: Date.now(),

      gameClass1: gameInstance.gameClass1, // A important class for rendering snake
      mapObjectHolder: gameInstance.mapObjectHolder, // By default, the map objects are shared between gameInstance and others
    });
    this.renderer = new PlayerRenderer(this.instance, settings, lastBoardRenderCtx.canvasCtx);
    console.log('[GSM] Other instance:', this.instance);
  }
  
  updateData (serializedData: GameInstance) {
    const oldEyeColor = this.instance?.snakeBodyConfig?.color1;

    this.instance.xaa = serializedData.xaa;
    this.instance.saa = serializedData.saa;
    this.instance.headState = serializedData.headState;
    this.instance.lastInvencibilityTime = serializedData.lastInvencibilityTime;
    this.instance.snakeBodyConfig.headState = serializedData.snakeBodyConfig.headState;
    this.instance.snakeBodyConfig.bodyPoses.length = serializedData.snakeBodyConfig.bodyPoses.length;
    serializedData.snakeBodyConfig.bodyPoses.forEach((x, i) => this.instance.snakeBodyConfig.bodyPoses[i] = new Vector2(x.x, x.y));
    this.instance.snakeBodyConfig.tailPos = new Vector2(serializedData.snakeBodyConfig.tailPos.x, serializedData.snakeBodyConfig.tailPos.y);
    this.instance.snakeBodyConfig.direction = serializedData.snakeBodyConfig.direction;
    this.instance.snakeBodyConfig.oldDirection = serializedData.snakeBodyConfig.oldDirection;
    this.instance.snakeBodyConfig.directionChanged = serializedData.snakeBodyConfig.directionChanged;
    this.instance.snakeBodyConfig.deathHeadState = serializedData.snakeBodyConfig.deathHeadState;
    this.instance.snakeBodyConfig.color1 = serializedData.snakeBodyConfig.color1;
    this.instance.snakeBodyConfig.color2 = serializedData.snakeBodyConfig.color2;
    if (serializedData.mapObjectHolder?.objs) {
      this.instance.mapObjectHolder.objs.length = serializedData.mapObjectHolder.objs.length;
      serializedData.mapObjectHolder.objs.forEach((x, i) => {
        if (!this.instance.mapObjectHolder.objs[i]) this.instance.mapObjectHolder.objs[i] = {} as Collectable;
        const proxied = createCollectableProxy(this.instance.mapObjectHolder.objs[i]);
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
    
    const newEyeColor = this.instance?.snakeBodyConfig?.color1;
    if (newEyeColor !== oldEyeColor) {
      // Regenerate all assets based on eye color
      findChildKeysInObject(this.instance, x => x instanceof AssetRenderer).forEach(key => {
        changeAssetColor((this.instance as any)[key], '#5282F2', newEyeColor);
      });
    }
    this.gameSharing.checkObjsChanged();
    this.instance.receivedData = true;
  };

  updateLatency(newLatency: number) {
    this.instance.latency = Math.min(MAX_LATENCY_COMPENSATION, ((gameInstance.latency / 2) + (newLatency / 2)) * LATENCY_COMPENSATION_AMPLIFIER);
  };

  getLatency() {
    return this.instance.latency;
  }
  
  render(resolution: any) {
    const renderPart = ((Date.now() - this.instance.latency) - this.instance.xaa) / this.instance.saa
    this.instance.receivedData && this.renderer.render(renderPart, true, resolution);
  };

  update() {
    this.instance.receivedData && this.instance.update((Date.now() - this.instance.latency));
  };
}

export const gameSharing = new GameSharing();
