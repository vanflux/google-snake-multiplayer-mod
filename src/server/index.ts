import { Server, Socket } from "socket.io";
import { Player } from "./player";

const port = 8443;

export class Game {
  public players: Player[] = [];

  constructor() {
    const server = new Server({
      transports: ['websocket'],
      cors: { origin: '*' },
      pingInterval: 2000,
    });

    server.on('connection', (socket) => {
      const player = new Player(socket);
      this.players.push(player);

      socket.on('disconnect', () => {
        this.players.splice(this.players.indexOf(player), 1);
      });
    });

    server.listen(port);
    console.log(`Server listening at ${port}`);
  }
}

new Game();
