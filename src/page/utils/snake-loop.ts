import { gameInstance } from "../game-hooks/game-logic-hook";
import { addCleanupFn } from "./cleanup";

class SnakeLoop {
  setup() {
    const mapping: any = {
      RIGHT: 'DOWN',
      DOWN: 'LEFT',
      LEFT: 'UP',
      UP: 'RIGHT',
    };
    const id = setInterval(() => {
      if (!window.snakeLoop) return;
      gameInstance.snakeBodyConfig.direction = mapping[gameInstance.snakeBodyConfig.direction] || 'RIGHT';
      [...document.querySelectorAll('div > h2')].find(x => x.textContent === 'Play')?.parentElement?.click();
    }, Math.random() * 50 + 500);
    addCleanupFn(() => clearInterval(id));
  }
}

export const snakeLoop = new SnakeLoop();
