import EventEmitter from "events";
import { CollectablesDataDto, collectablesDataDtoSchema } from "../common/dtos/collectables-data-dto";
import { SnakeDataDto, snakeDataDtoSchema } from "../common/dtos/snake-data-dto";
import { Player } from "./player";

export class Room extends EventEmitter {
  public players = new Set<Player>();
  public playersCleanup = new Map<Player, ()=>void>();

  constructor(public id: string, public capacity: number) {
    super();
  }

  addPlayer(player: Player) {
    if (this.players.has(player)) return;
    this.players.add(player);

    const onDisconnect = () => this.removePlayer(player);
    
    const onSnakeData = (data: SnakeDataDto) => {
      const result = snakeDataDtoSchema.safeParse(data);
      if (!result.success) {
        console.error('snakeDataDto validate failed, data:', data);
        return player.socket.disconnect();
      }
      this.players.forEach(p => p !== player && p.socket.emit('other_snake_data', { id: player.socket.id, data: result.data }));
    };

    const onCollectablesData = (data: CollectablesDataDto) => {
      const result = collectablesDataDtoSchema.safeParse(data);
      if (!result.success) {
        console.error('snakeDataDto validate failed, data:', data);
        return player.socket.disconnect();
      }
      this.players.forEach(p => p !== player && p.socket.emit('other_collectables_data', { id: player.socket.id, data: result.data }));
    };

    player.socket.on('disconnect', onDisconnect);
    player.socket.on('snake_data', onSnakeData);
    player.socket.on('collectables_data', onCollectablesData);
    
    this.players.forEach(p => p !== player && player.socket.emit('other_connect', { id: p.socket.id }));
    this.players.forEach(p => p !== player && p.socket.emit('other_connect', { id: player.socket.id }));
    
    this.playersCleanup.set(player, () => {
      player.socket.off('disconnect', onDisconnect);
      player.socket.off('snake_data', onSnakeData);
      player.socket.off('collectables_data', onCollectablesData);
    });
  }

  removePlayer(player: Player) {
    if (!this.players.has(player)) return;
    this.players.delete(player);
    this.playersCleanup.get(player)?.();
    this.playersCleanup.delete(player);
    this.players.forEach(p => p !== player && p.socket.emit('other_disconnect', { id: player.socket.id }));
    if (this.players.size === 0) {
      console.log(`Room ${this.id} is empty!`);
      this.emit('empty');
    }
  }
}
