// Responsability: Share game instance with other players and sync other player instances

import EventEmitter from "events";
import { CollectablesDataDto } from "../../common/dtos/collectables-data-dto";
import { SnakeDataDto } from "../../common/dtos/snake-data-dto";
import { gameInstance, lastBoardRenderCtx } from "../game-hooks/game-logic-hook";
import { detour, findChildKeysInObject } from "../game-hooks/utils";
import { addCleanupFn } from "../utils/cleanup";
import { connection } from "./connection";

class GameSharing extends EventEmitter {
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
    connection.on('other_snake_data', ({id, data}) => {
      const other = this.others.get(id);
      if (!other) return;
      other.updateData(data);
    });
    connection.on('other_collectables_data', ({id, data}) => {
      const other = this.others.get(id);
      if (!other) return;
      this.updateCollectables(data);
    });
    connection.on('latency', ({latency}) => {
      gameSharing.updateLatency(latency);
      this.emit('latency_changed', latency);
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
        const serializedData = gameSharing.getThisSnakeData();
        connection.send('snake_data', serializedData);
      }
    }));

    addCleanupFn(detour(PlayerRenderer.prototype, 'render', function (a: any, b: any, resolution: any) {
      // Update + render other players
      if (this.instance === gameInstance) {
        self.others.forEach(other => other.update());
        self.others.forEach(other => other.render(resolution));
      }
    }));

    addCleanupFn(detour(GameInstance.prototype, 'collectAndSpawnNextCollectable', function (a: any, b: any, c: any) {
      if (this !== gameInstance) {
        return { return: true }; // Cancel original "collectAndSpawnNextCollectable" call and return true to bypass collection
      }
    }, function (a: any, b: any, c: any) {
      if (this === gameInstance) {
        const serializedData = gameSharing.getThisCollectablesData();
        connection.send('collectables_data', serializedData);
      }
    }));
  }
  
  private updateCollectables(data: CollectablesDataDto) {
    gameInstance.mapObjectHolder.objs.length = data.collectables.length;
    data.collectables.forEach((x, i) => {
      if (!gameInstance.mapObjectHolder.objs[i]) gameInstance.mapObjectHolder.objs[i] = {} as Collectable;
      const proxied = createCollectableProxy(gameInstance.mapObjectHolder.objs[i]);
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
  
  private createOther() {
    return new GameSharingOther(this);
  }

  private getThisSnakeData(): SnakeDataDto {
    return {
      xaaDelta: Date.now() - gameInstance.xaa,
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
    };
  };

  private getThisCollectablesData(): CollectablesDataDto {
    return {
      collectables: gameInstance?.mapObjectHolder?.objs?.map((x: any) => {
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
    };
  }

  private updateLatency(newLatency: number) {
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
  
  updateData(data: SnakeDataDto) {
    const oldColor1 = this.instance?.snakeBodyConfig?.color1;

    this.instance.xaaDelta = data.xaaDelta;
    this.instance.xaa = Date.now();
    this.instance.saa = data.saa;
    this.instance.headState = data.headState;
    this.instance.lastInvencibilityTime = data.lastInvencibilityTime;
    this.instance.snakeBodyConfig.bodyPoses.length = data.snakeBodyConfig.bodyPoses.length;
    data.snakeBodyConfig.bodyPoses.forEach((x, i) => this.instance.snakeBodyConfig.bodyPoses[i] = new Vector2(x.x, x.y));
    this.instance.snakeBodyConfig.tailPos = new Vector2(data.snakeBodyConfig.tailPos.x, data.snakeBodyConfig.tailPos.y);
    this.instance.snakeBodyConfig.direction = data.snakeBodyConfig.direction;
    this.instance.snakeBodyConfig.oldDirection = data.snakeBodyConfig.oldDirection;
    this.instance.snakeBodyConfig.directionChanged = data.snakeBodyConfig.directionChanged;
    this.instance.snakeBodyConfig.deathHeadState = data.snakeBodyConfig.deathHeadState;
    this.instance.snakeBodyConfig.color1 = data.snakeBodyConfig.color1;
    this.instance.snakeBodyConfig.color2 = data.snakeBodyConfig.color2;

    // Rebuild assets if needed
    const newColor1 = this.instance?.snakeBodyConfig?.color1;
    if (newColor1 !== oldColor1) {
      findChildKeysInObject(this.renderer, x => x instanceof AssetRenderer).forEach(key => {
        changeAssetColor((this.renderer as any)[key], '#5282F2', newColor1);
      });
    }
    this.instance.receivedData = true;
  };

  updateLatency(newLatency: number) {
    this.instance.latency = (gameInstance.latency / 2) + (newLatency / 2);
  };

  getLatency() {
    return this.instance.latency;
  }
  
  render(resolution: any) {
    const renderPart = ((Date.now() + this.instance.xaaDelta) - this.instance.xaa) / this.instance.saa
    this.instance.receivedData && this.renderer.render(renderPart, true, resolution);
  }

  update() {
    this.instance.receivedData && this.instance.update(Date.now() + this.instance.xaaDelta);
  }
}

export const gameSharing = new GameSharing();
