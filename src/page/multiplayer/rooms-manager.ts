import EventEmitter from "events";
import { detour } from "../game-hooks/utils";
import { addCleanupFn } from "../utils/cleanup";
import { connection } from "./connection";
import { Room } from "./room";

class RoomsManager extends EventEmitter {
  public room?: Room;

  setup() {
    const self = this;

    addCleanupFn(detour(GameEngine.prototype, 'reset', function (isModController) {
      if (isModController) return;
      if (!self.room) self.joinRandom();
    }));

    connection.on('connect', () => {
      this.joinRandom();
    });

    connection.on('room:join', ({ id }) => {
      this.room?.destroy();
      this.room = new Room(id);
    });

    connection.on('room:leave', () => {
      this.room = undefined;
    });
  }

  joinRandom() {
    connection.send('room:join:random');
  }
}

export const roomsManager = new RoomsManager();
