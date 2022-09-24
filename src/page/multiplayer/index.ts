import { gameInstance } from "../game-hooks/game-logic-hook";
import { createGameSharing, GameSharing, OtherGameSharing } from "./game-sharing";
import { connection } from "./connection";
import EventEmitter from "events";
import { addCleanupFn } from "../utils/cleanup";
import { detour } from "../game-hooks/utils";
import { snakeCollision } from "./snake-collision";

class Multiplayer extends EventEmitter {
  private others = new Map<string, OtherGameSharing>();
  private lastDataSend = 0; // Last data send date
  private lastDirection!: string;
  private gameSharing!: GameSharing;

  getOthers() {
    return this.others;
  }

  getLatency() {
    return this.gameSharing.getLatency();
  }

  setup() {
    const self = this;
    this.gameSharing = createGameSharing();

    // Setup communication
    connection.on('connect', () => {
      console.log('[GSM] Connected to the server!');
      this.others.clear();
      this.emit('others_changed', this.others);
    });
    connection.on('other_connect', ({id}) => {
      console.log('[GSM] Other connect', id);
      const other = this.gameSharing.createOther();
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
      this.gameSharing.updateLatency(latency);
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
        const serializedData = self.gameSharing.getThisData();
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
    
    snakeCollision.setup();
  }
}

export const multiplayer = new Multiplayer();
