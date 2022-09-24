import EventEmitter from "events";
import { snakeCollision } from "./snake-collision";
import { gameSharing } from "./game-sharing";

class Multiplayer extends EventEmitter {
  setup() {
    gameSharing.setup();
    snakeCollision.setup();
  }
}

export const multiplayer = new Multiplayer();
