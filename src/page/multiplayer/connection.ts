import EventEmitter from "events";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { addCleanupFn } from "../utils/cleanup";

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

export class Connection extends EventEmitter {
  private socket?: Socket;
  private destroyHandlerList: (() => void)[] = [];

  get connected() {
    return this.socket?.connected || false;
  }

  constructor() {
    super();
    addCleanupFn(() => this.socket?.close());
  }

  private forwardEvent(eventName: string) {
    const handler = (...args: any[]) => this.emit(eventName, ...args);
    const socket = this.socket;
    socket?.on(eventName, handler);
    this.destroyHandlerList.push(() => socket?.off(eventName, handler));
  }

  private destroyHandlers() {
    this.destroyHandlerList.forEach(x => x());
    this.destroyHandlerList = [];
  }

  public connect(url: string) {
    this.socket?.close();
    this.destroyHandlers();
    this.socket = io(url, {
      secure: false,
      transports: ['websocket'],
    });
    this.socket.on('connect', () => {
      this.socket?.emit('version', { version: VERSION });
    });
    this.forwardEvent('connect');
    this.forwardEvent('disconnect');
    this.forwardEvent('latency');
    this.forwardEvent('invencible');
    this.forwardEvent('other:connect');
    this.forwardEvent('other:disconnect');
    this.forwardEvent('other:ready');
    this.forwardEvent('other:invencible');
    this.forwardEvent('other:snake:data');
    this.forwardEvent('other:collectables:data');
    this.forwardEvent('other:latency');
    this.forwardEvent('room:state');
    this.forwardEvent('room:counter');
    this.forwardEvent('room:reset-player');
    this.forwardEvent('room:join');
    this.forwardEvent('room:leave');
    this.forwardEvent('connect_error');
  }

  public send(eventName: string, ...args: any[]) {
    this.socket?.emit(eventName, ...args);
  }
}

export const connection = new Connection();
