import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { addCleanupFn } from "./cleanup";

export let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

export function setupSocket() {
  socket = io('ws://localhost:3512', { secure: false, transports: ['websocket'] });
  addCleanupFn(() => socket.close());
}
