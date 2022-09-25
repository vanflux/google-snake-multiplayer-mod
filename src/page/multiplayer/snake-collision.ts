import { gameInstance } from "../game-hooks/game-logic-hook";
import { detour } from "../game-hooks/utils";
import { addCleanupFn } from "../utils/cleanup";
import { gameSharing } from "./game-sharing";
import { nextPosition } from "./utils";

class SnakeCollision {
  setup() {
    addCleanupFn(detour(PlayerRenderer.prototype, 'render', function (a: any, b: any, resolution: any) {
      // Update last invencibility of the player
      if (this.instance === gameInstance && gameInstance.snakeBodyConfig.direction === 'NONE') gameInstance.lastInvencibilityTime = Date.now();

      // Blink players when they are invencible changing the style using canvas filters
      const invencibilityTimeDelta = Date.now() - this.instance.lastInvencibilityTime;
      if (invencibilityTimeDelta < 3500) {
        const blink = (Math.floor(invencibilityTimeDelta / 500) % 2) === 0;
        this.canvasCtx.filter = blink ? `grayscale(90%) brightness(1.2) contrast(30%)` : 'none';
      }
    }, function (a: any, b: any, resolution: any) {
      // Return normal style
        this.canvasCtx.filter = 'none';
    }));
    
    addCleanupFn(detour(GameInstance.prototype, 'checkDeathCollision', function (pos) {
      const snakeBodyConfig = this.snakeBodyConfig;
      if (Date.now() - this.lastInvencibilityTime > 3500) {
        const otherInstances = [gameInstance, ...[...gameSharing.others.values()].map(x => x.instance)].filter(x => x !== this);
        otherInstances.forEach(instance => {
          if (Date.now() - instance.lastInvencibilityTime < 3500) return;
          instance.snakeBodyConfig.bodyPoses.forEach((pos, i, arr) => {
            if (i === arr.length - 1) return; // Ignore tail collision
            const pos1 = nextPosition(snakeBodyConfig.bodyPoses[0], snakeBodyConfig.direction);
            if (pos1.equals(pos)) this.die();
          });
        });
      } 
    }));
  }
}

export const snakeCollision = new SnakeCollision();