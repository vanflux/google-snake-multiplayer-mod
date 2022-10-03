import { Socket } from "socket.io";
import { RoomListItemDto } from "../common/dtos/room-list-item-dto";
import { Room } from "./room";
import { roomsService } from "./services/rooms-service";

export class Player {
  public version?: string;
  public lastPingSent = Date.now();
  public room?: Room;

  constructor(public socket: Socket) {
    // Room messages

    socket.on('room:list', () => {
      const rooms = roomsService.rooms.map<RoomListItemDto>(room => ({
        id: room.id,
        capacity: room.capacity,
        playersCount: room.players.size,
      }));
      socket.emit('room:list', rooms);
    });
    
    socket.on('room:join:random', () => {
      this.room?.removePlayer(this);
      this.room = roomsService.getRandomRoom();
      this.room.addPlayer(this);
    });

    // Version control messages

    socket.on('version', (version: string) => {
      this.version = version;
    });

    // Latency messages

    socket.conn.on('packet', (packet) => {
      if (packet.type === 'pong') {
        const latency = Date.now() - this.lastPingSent;
        socket.emit('latency', { latency });
        this.room?.players.forEach(player => player.sendOtherLatency(socket.id, latency));
      }
    });

    socket.conn.on('packetCreate', (packet) => {
      if (packet.type === 'ping') this.lastPingSent = Date.now();
    });
  }

  sendOtherLatency(id: string, latency: number) {
    this.socket.emit('other_latency', { id, latency })
  }
}
