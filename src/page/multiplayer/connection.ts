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
    this.forwardEvent('other_connect');
    this.forwardEvent('other_disconnect');
    this.forwardEvent('other_snake_data');
    this.forwardEvent('other_collectables_data');
    this.forwardEvent('other_latency');
    this.forwardEvent('connect_error');
  }

  public send(eventName: string, ...args: any[]) {
    this.socket?.emit(eventName, ...args);
  }
}

export const connection = new Connection();
