import { gameInstanceSnake, setOnGameBeforeBoardRender, setOnGameBeforeMainPlayerRender } from "../game-hooks/game-logic-hook";
import { createGameSharing, GameSharing, OtherGameSharing } from "./game-sharing";
import { connection } from "./connection";
import EventEmitter from "events";

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
    
    setOnGameBeforeBoardRender(() => {
      // Send player data to others
      const curDirection = gameInstanceSnake.direction;
      if (this.lastDataSend === undefined || Date.now() - this.lastDataSend > 250 || this.lastDirection !== curDirection) {
        this.lastDataSend = Date.now();
        this.lastDirection = curDirection;
        const serializedData = this.gameSharing.getThisData();
        connection.send('data', serializedData);
      }
    });
    setOnGameBeforeMainPlayerRender((self, [,,resolution]) => {
      // Update + render other players
      this.others.forEach(other => other.update());
      this.others.forEach(other => other.render(resolution));
    });
  }
}

export const multiplayer = new Multiplayer();
