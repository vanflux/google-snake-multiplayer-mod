import EventEmitter from "events";
import { Socket } from "socket.io";
import { CollectablesDataDto } from "../common/dtos/collectables-data-dto";
import { RoomListItemDto } from "../common/dtos/room-list-item-dto";
import { SnakeDataDto, snakeDataDtoSchema } from "../common/dtos/snake-data-dto";
import { RoomState } from "../common/enums/room-state";
import { Room } from "./room";
import { roomsService } from "./services/rooms-service";

export class Player extends EventEmitter {
  public version?: string;
  public lastPingSent = Date.now();
  public room?: Room;
  public latency = -1;
  public snakeData?: SnakeDataDto;
  public connected = true;
  public ready = false;

  get id() { return this.socket.id }

  constructor(private socket: Socket) {
    super();

    // Disconnection

    socket.on('disconnect', () => {
      this.connected = false;
      this.emit('disconnect');
    });

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
    
    socket.on('snake:data', (data: SnakeDataDto) => {
      const result = snakeDataDtoSchema.safeParse(data);
      if (!result.success) {
        console.error('snakeDataDto validate failed, data:', data);
        return this.disconnect();
      }
      this.snakeData = result.data;
      this.emit('snake:data', this.snakeData);
    });
    
    socket.on('collectables:data', (data: CollectablesDataDto) => {
      this.emit('collectables:data', data);
    });
    
    socket.on('ready', () => {
      console.log('Player', this.id, 'is ready');
      this.ready = true;
      this.emit('ready');
    });

    // Version control messages

    socket.on('version', (version: string) => {
      this.version = version;
    });

    // Latency messages

    socket.conn.on('packet', (packet) => {
      if (packet.type === 'pong') {
        this.latency = Date.now() - this.lastPingSent;
        socket.emit('latency', { latency: this.latency });
        this.room?.players.forEach(player => player.sendOtherLatency(socket.id, this.latency));
      }
    });

    socket.conn.on('packetCreate', (packet) => {
      if (packet.type === 'ping') this.lastPingSent = Date.now();
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

  isDeath() {
    return this.snakeData?.headState || false;
  }

  sendRoomJoin(id: string) {
    this.socket.emit('room:join', { id });
  }

  sendRoomLeave() {
    this.socket.emit('room:leave');
  }

  sendRoomState(state: RoomState) {
    this.socket.emit('room:state', { state });
  }

  sendRoomCounter(counter: number) {
    this.socket.emit('room:counter', { counter });
  }

  sendResetPlayer() {
    this.socket.emit('room:reset-player');
  }

  sendInvencible(invencible: boolean) {
    this.socket.emit('invencible', { invencible });
  }

  sendOtherReady(id: string, ready: boolean) {
    this.socket.emit('other:ready', { id, ready });
  }

  sendOtherInvencible(id: string, invencible: boolean) {
    this.socket.emit('other:invencible', { id, invencible });
  }

  sendOtherSnakeData(id: string, data: SnakeDataDto) {
    this.socket.emit('other:snake:data', { id, data });
  }

  sendOtherCollectablesData(id: string, data: CollectablesDataDto) {
    this.socket.emit('other:collectables:data', { id, data });
  }

  sendOtherConnect(id: string) {
    this.socket.emit('other:connect', { id });
  }

  sendOtherDisconnect(id: string) {
    this.socket.emit('other:disconnect', { id });
  }

  sendOtherLatency(id: string, latency: number) {
    this.socket.emit('other:latency', { id, latency });
  }
}
