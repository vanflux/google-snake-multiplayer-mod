import { setOnGameBeforeGameRender, setOnGameBeforePlayerRender } from "../game-hooks/game-logic-hook";
import { createGameSharing, OtherGameSharing } from "./game-sharing";
import { connection } from "./connection";

export function setupMultiplayer() {
  const others = new Map<string, OtherGameSharing>(); // Other game sharing map
  let lastDataSend = 0; // Last data send date

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
  connection.connect('ws', '127.0.0.1', 3512);
  
  setOnGameBeforeGameRender((_, [renderPart]) => {
    // Send player data to others
    if (lastDataSend === undefined || Date.now() - lastDataSend > 20) {
      const serializedData = gameSharing.getThisData(renderPart);
      connection.send('data', serializedData);
      lastDataSend = Date.now();
    }
  });
  setOnGameBeforePlayerRender((_, [,,resolution]) => {
    // Render other players
    others.forEach(other => other.render(resolution));
  });
}
