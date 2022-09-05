import { GameInstance, Settings, SnakeBodyConfig, Vector2 } from "../../hooks/game-hook";
import { Mapper, SerializationCtx } from "../vf-serializer";

export class Vector2Mapper implements Mapper {
  name = 'v2';

  types = [Vector2.name];

  map(unmapped: any, ctx: SerializationCtx) {
    const ref = ctx.refs.size;
    return [this.name, ref, [unmapped.x, unmapped.y]];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    dest = new Vector2(mapped[2][0], mapped[2][1]);
    // FIXME: Probably this is not a problem here, but on the other game instance
    // creation, the vector references are messing up with the game instance.

    /*if (!dest) {
      dest = new Vector2(mapped[2][0], mapped[2][1]);
    } else {
      dest.x = mapped[2][0];
      dest.y = mapped[2][1];
    }*/
    if (mapped[1] > -1) ctx.refs.set(mapped[1], dest);
    return dest;
  }
}
