import { Vector2 } from "../../../game-hooks/game-logic-hook";
import { Mapper, SerializationCtx } from "..";

export class Vector2Mapper implements Mapper {
  id = 6;

  types = [Vector2.name];

  map(unmapped: any, ctx: SerializationCtx) {
    const ref = ctx.refs.size;
    return [this.id, ref, [unmapped.x, unmapped.y]];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    dest = new Vector2(mapped[2][0], mapped[2][1]);
    if (mapped[1] > -1) ctx.refs.set(mapped[1], dest);
    return dest;
  }
}
