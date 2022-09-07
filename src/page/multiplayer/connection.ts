import EventEmitter from "events";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { addCleanupFn } from "../utils/cleanup";

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

export function joinServer(ip: string, port: number) {
  socket = io('ws://localhost:3512', {
    secure: false,
    transports: ['websocket'],
  });
  socket.on('connect_error', () => {
    setTimeout(() => {
      socket.connect();
    }, 1000);
  });
  addCleanupFn(() => socket.close());
}

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

  public connect(protocol: string, ip: string, port: number) {
    this.socket?.close();
    this.destroyHandlers();
    this.socket = io(`${protocol}://${ip}:${port}`, {
      secure: false,
      transports: ['websocket'],
    });
    this.forwardEvent('connect');
    this.forwardEvent('disconnect');
    this.forwardEvent('other_connect');
    this.forwardEvent('other_disconnect');
    this.forwardEvent('other_data');
    this.forwardEvent('connect_error');
  }

  public send(eventName: string, ...args: any[]) {
    this.socket?.emit(eventName, ...args);
  }
}

export const connection = new Connection();
