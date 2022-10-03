import EventEmitter from "events";
import { snakeCollision } from "./snake-collision";
import { gameSharing } from "./game-sharing";
import { roomsManager } from "./rooms-manager";

class Multiplayer extends EventEmitter {
  setup() {
    roomsManager.setup();
    gameSharing.setup();
    snakeCollision.setup();
  }
}

export const multiplayer = new Multiplayer();
