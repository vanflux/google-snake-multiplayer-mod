import { RoomState } from "../../common/enums/room-state";
import { Room } from "../room";

class RoomsService {
  private nextId = 0;
  public rooms: Room[] = [];

  getRandomRoom() {
    const existentRoom = this.rooms.find(room => room.state == RoomState.WAITING_PLAYERS && room.players.size < room.capacity);
    if (existentRoom) return existentRoom;
    const id = `random-${this.nextId++}`;
    console.log(`Creating new room ${id}`);
    const newRoom = new Room(id, 2);
    this.rooms.push(newRoom);
    newRoom.on('empty', () => this.deleteRoom(newRoom.id))
    return newRoom;
  }

  deleteRoom(id: string) {
    console.log(`Deleting room ${id}`);
    const index = this.rooms.findIndex(room => room.id === id);
    if (index < 0) return;
    this.rooms.splice(index, 1);
  }
}

export const roomsService = new RoomsService();
