import EventEmitter from "events";
import { CollectablesDataDto, collectablesDataDtoSchema } from "../common/dtos/collectables-data-dto";
import { SnakeDataDto } from "../common/dtos/snake-data-dto";
import { RoomState } from "../common/enums/room-state";
import { sleep } from "../common/utils/sleep";
import { Player } from "./player";

export class Room extends EventEmitter {
  public players = new Set<Player>();
  public playersCleanup = new Map<Player, ()=>void>();
  public state = RoomState.WAITING_PLAYERS;
  public startTime = 0;

  constructor(public id: string, public capacity: number) {
    super();
  }

  addPlayer(player: Player) {
    if (this.players.size === this.capacity) return;
    if (this.players.has(player)) return;
    this.players.add(player);

    const onDisconnect = () => this.removePlayer(player);
    
    const onSnakeData = async (data: SnakeDataDto) => {
      this.players.forEach(p => p !== player && p.sendOtherSnakeData(player.id, data));

      if (this.state === RoomState.INGAME) {
        if (player.isDeath()) {
          player.sendInvencible(true);
          this.players.forEach(p => p !== player && p.sendOtherInvencible(player.id, true));
          this.setState(RoomState.ENDED);
        }
      }
    };

    const onCollectablesData = (data: CollectablesDataDto) => {
      const result = collectablesDataDtoSchema.safeParse(data);
      if (!result.success) {
        console.error('snakeDataDto validate failed, data:', data);
        return player.disconnect();
      }
      this.players.forEach(p => p !== player && p.sendOtherCollectablesData(player.id, result.data));
    };

    const onReady = () => {
      this.players.forEach(p => p !== player && p.sendOtherReady(player.id, true));
      if (this.isEveryoneReady() && this.players.size === this.capacity) {
        this.startGame();
      }
    };

    player.on('disconnect', onDisconnect);
    player.on('snake:data', onSnakeData);
    player.on('collectables:data', onCollectablesData);
    player.on('ready', onReady);
    
    this.playersCleanup.set(player, () => {
      player.off('disconnect', onDisconnect);
      player.off('snake:data', onSnakeData);
      player.off('collectables:data', onCollectablesData);
      player.off('ready', onReady);
    });

    player.sendRoomJoin(this.id);
    this.players.forEach(p => p !== player && player.sendOtherConnect(p.id));
    this.players.forEach(p => p !== player && p.sendOtherConnect(player.id));

    this.players.forEach(p => p !== player && player.sendOtherReady(p.id, p.ready));
    this.players.forEach(p => p !== player && p.sendOtherReady(player.id, player.ready));

    this.players.forEach(p => p !== player && player.sendOtherInvencible(p.id, true));
    this.players.forEach(p => p !== player && p.sendOtherInvencible(player.id, true));
    player.sendInvencible(true);

    player.sendRoomState(this.state);
  }

  removePlayer(player: Player) {
    if (!this.players.has(player)) return;
    this.players.delete(player);
    this.playersCleanup.get(player)?.();
    this.playersCleanup.delete(player);
    this.players.forEach(p => p !== player && p.sendOtherDisconnect(player.id));
    player.sendRoomLeave();
    if (this.players.size < this.capacity) {
      this.setState(RoomState.WAITING_PLAYERS);
    }
    if (this.players.size === 0) {
      console.log(`Room ${this.id} is empty!`);
      this.emit('empty');
    }
  }

  private isEveryoneReady() {
    return [...this.players.values()].every(player => player.ready);
  }

  private unsetEveryoneReady() {
    return this.players.forEach(player => {
      player.ready = false;
      this.players.forEach(p => p !== player && p.sendOtherReady(player.id, false));
    });
  }

  private async startGame() {
    console.log('Room starting game');
    this.players.forEach(p => p.sendInvencible(true));
    this.players.forEach(p => this.players.forEach(p2 => p !== p2 && p2.sendOtherInvencible(p.id, true)));
    this.resetPlayers();
    this.setState(RoomState.STARTING);
    this.sendCounter(3);
    await sleep(1000);
    this.sendCounter(2);
    await sleep(1000);
    this.sendCounter(1);
    await sleep(1000);
    this.setState(RoomState.INGAME);
    this.startTime = Date.now();
    this.unsetEveryoneReady();
    this.resetPlayers();
    await sleep(3000);
    this.players.forEach(p => p.sendInvencible(false));
    this.players.forEach(p => this.players.forEach(p2 => p !== p2 && p2.sendOtherInvencible(p.id, false)));
  }

  private sendCounter(counter: number) {
    this.players.forEach(p => p.sendRoomCounter(counter));
  }

  private setState(state: RoomState) {
    this.state = state;
    this.players.forEach(p => p.sendRoomState(state));
  }

  private resetPlayers() {
    this.players.forEach(p => p.sendResetPlayer());
  }
}
