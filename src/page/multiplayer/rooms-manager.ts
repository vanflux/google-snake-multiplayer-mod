import { gameInstance } from "../game-hooks/game-logic-hook";
import { detour } from "../game-hooks/utils";
import { addCleanupFn } from "../utils/cleanup";
import { connection } from "./connection";

class RoomsManager {
  setup() {
    addCleanupFn(detour(GameInstance.prototype, 'reset', function () {
      if (this !== gameInstance) return;
      // Round started
      connection.send('room:join:random');
    }));
  }
}

export const roomsManager = new RoomsManager();
