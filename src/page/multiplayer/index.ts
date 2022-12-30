import EventEmitter from "events";
import { roomsManager } from "./rooms-manager";
import { snakeCollision } from "./snake-collision";
import { gameSharing } from "./game-sharing";

class Multiplayer extends EventEmitter {
  setup() {
    roomsManager.setup();
    gameSharing.setup();
    snakeCollision.setup();
  }
}

export const multiplayer = new Multiplayer();
