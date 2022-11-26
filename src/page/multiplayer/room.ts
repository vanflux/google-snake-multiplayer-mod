import { RoomState } from "../../common/enums/room-state";
import { connection } from "./connection";
import { gameSharing } from "./game-sharing";
import { SnakeDataDto } from "../../common/dtos/snake-data-dto";
import { CollectablesDataDto } from "../../common/dtos/collectables-data-dto";
import { gameEngine } from "../game-hooks/game-logic-hook";
import { addCleanupFn } from "../utils/cleanup";
import { detour } from "../game-hooks/utils";

export class Room {
  public state = RoomState.WAITING_PLAYERS;
  public counter = 0;
  public destroyed = false;

  private cleanupHandlers: ()=>void;

  constructor(public id: string) {
    const onState = ({ state }: { state: RoomState }) => {
      this.state = state;
    };
    
    const onCounter = ({ counter }: { counter: number }) => {
      this.counter = counter;
    };
    
    const onLeave = () => {
      this.destroy();
    };
    
    const onResetPlayer = () => {
      gameEngine.reset(true);
    };
    
    const onOtherConnect = ({ id }: { id: string }) => {
      console.log('[GSM] Other connect', id);
      gameSharing.addOther(id);
    };
    
    const onOtherDisconnect = ({ id }: { id: string }) => {
      console.log('[GSM] Other disconnect', id);
      gameSharing.deleteOther(id);
    };

    const onOtherReady = ({ id, ready }: { id: string, ready: boolean }) => {
      console.log('[GSM] Other ready', id, ready);
      gameSharing.updateOtherReady(id, ready);
    };

    const onOtherInvencible = ({ id, invencible }: { id: string, invencible: boolean }) => {
      console.log('[GSM] Other invencible', id, invencible);
      gameSharing.updateOtherInvencible(id, invencible);
    };
    
    const onOtherSnake = ({ id, data }: { id: string, data: SnakeDataDto }) => {
      gameSharing.updateOtherSnake(id, data);
    };
    
    const onOtherLatency = ({ id, latency }: { id: string, latency: number }) => {
      gameSharing.updateOtherLatency(id, latency);
    };
    
    const onOtherCollectablesData = ({ data }: { data: CollectablesDataDto }) => {
      gameSharing.updateCollectables(data);
    };
    
    const onLatency = ({ latency }: { latency: number }) => {
      gameSharing.updateLatency(latency);
    };
    
    const onInvencible = ({ invencible }: { invencible: boolean }) => {
      gameSharing.updateInvencible(invencible);
    };
    
    const onSnakeData = (data: SnakeDataDto) => {
      connection.send('snake:data', data);
    };
    
    const onCollectablesData = (data: CollectablesDataDto) => {
      connection.send('collectables:data', data);
    };

    const restoreResetDetour = detour(GameEngine.prototype, 'reset', function (isModController) {
      if (isModController) return;
      connection.send('ready');
    });

    connection.on('room:state', onState);
    connection.on('room:counter', onCounter);
    connection.on('room:leave', onLeave);
    connection.on('room:reset-player', onResetPlayer);
    connection.on('other:connect', onOtherConnect);
    connection.on('other:disconnect', onOtherDisconnect);
    connection.on('other:ready', onOtherReady);
    connection.on('other:invencible', onOtherInvencible);
    connection.on('other:snake:data', onOtherSnake);
    connection.on('other:latency', onOtherLatency);
    connection.on('other:collectables:data', onOtherCollectablesData);
    connection.on('latency', onLatency);
    connection.on('invencible', onInvencible);
    gameSharing.on('snake:data', onSnakeData);
    gameSharing.on('collectables:data', onCollectablesData);
    
    this.cleanupHandlers = () => {
      connection.off('room:state', onState);
      connection.off('room:counter', onCounter);
      connection.off('room:leave', onLeave);
      connection.off('room:reset-player', onResetPlayer);
      connection.off('other:connect', onOtherConnect);
      connection.off('other:disconnect', onOtherDisconnect);
      connection.off('other:ready', onOtherReady);
      connection.off('other:invencible', onOtherInvencible);
      connection.off('other:snake:data', onOtherSnake);
      connection.off('other:latency', onOtherLatency);
      connection.off('other:collectables:data', onOtherCollectablesData);
      connection.off('latency', onLatency);
      connection.off('invencible', onInvencible);
      gameSharing.off('snake:data', onSnakeData);
      gameSharing.off('collectables:data', onCollectablesData);
      restoreResetDetour();
    };

    gameSharing.clear();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cleanupHandlers();
  }
}
