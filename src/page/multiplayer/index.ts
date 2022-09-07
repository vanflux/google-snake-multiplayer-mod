import { gameInstanceSnake, setOnGameBeforeBoardRender, setOnGameBeforeMainPlayerRender } from "../game-hooks/game-logic-hook";
import { createGameSharing, OtherGameSharing } from "./game-sharing";
import { connection } from "./connection";

export function setupMultiplayer() {
  const others = new Map<string, OtherGameSharing>(); // Other game sharing map
  let lastDataSend = 0; // Last data send date
  let lastDirection: string;

  const gameSharing = createGameSharing();

  // Setup communication
  connection.on('connect', () => {
    console.log('[GSM] Connected to the server!');
    others.clear();
  });
  connection.on('other_connect', ({id}) => {
    console.log('[GSM] Other connect', id);
    const other = gameSharing.createOther();
    others.set(id, other);
  });
  connection.on('other_disconnect', ({id}) => {
    console.log('[GSM] Other disconnect', id);
    others.delete(id);
  });
  connection.on('other_data', ({id, data}) => {
    const other = others.get(id);
    if (!other) return;
    other.updateData(data);
  });
  connection.on('latency', ({latency}) => {
    gameSharing.updateLatency(latency);
  });
  connection.on('other_latency', ({id, latency}) => {
    const other = others.get(id);
    if (!other) return;
    other.updateLatency(latency);
  });
  
  setOnGameBeforeBoardRender(() => {
    // Send player data to others
    const curDirection = gameInstanceSnake.direction;
    if (lastDataSend === undefined || Date.now() - lastDataSend > 250 || lastDirection !== curDirection) {
      lastDataSend = Date.now();
      lastDirection = curDirection;
      const serializedData = gameSharing.getThisData();
      connection.send('data', serializedData);
    }
  });
  setOnGameBeforeMainPlayerRender((self, [,,resolution]) => {
    // Update + render other players
    others.forEach(other => other.update());
    others.forEach(other => other.render(resolution));
  });
}
