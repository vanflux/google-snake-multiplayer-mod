import { gameInstanceSnake } from "../game-hooks/game-logic-hook";
import { addCleanupFn } from "./cleanup";

export function setupSnakeLoop() {
  const mapping: any = {
    RIGHT: 'DOWN',
    DOWN: 'LEFT',
    LEFT: 'UP',
    UP: 'RIGHT',
  };
  const id = setInterval(() => {
    if (!window.snakeLoop) return;
    gameInstanceSnake.direction = mapping[gameInstanceSnake.direction] || 'RIGHT';
    [...document.querySelectorAll('div > h2')].find(x => x.textContent === 'Play')?.parentElement?.click();
  }, Math.random() * 50 + 500);
  addCleanupFn(() => clearInterval(id));
}
