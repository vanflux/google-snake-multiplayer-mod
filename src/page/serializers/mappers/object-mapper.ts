import { GameInstance, MapObjectHolder, Settings, SnakeBodyConfig, Vector2 } from "../../hooks/game-hook";
import { Mapper, SerializationCtx } from "../vf-serializer";

export class ObjectMapper implements Mapper {
  id = 4;

  types = [
    'Object',
    
    // FIXME: Maybe move it to outside? "Inject" on the ObjectMapper creation
    Settings.name,
    SnakeBodyConfig.name,
    GameInstance.name,
    //MapObjectHolder.name,
    Set.name,
    Map.name,
    Object.name,
  ];

  map(unmapped: any, ctx: SerializationCtx) {
    const out: any = {};
    const ref = ctx.refs.size;
    for (const key in unmapped) {
      const serialized = ctx.serialize(unmapped[key], ctx);
      if (serialized !== undefined) out[key] = serialized;
    }
    return [this.id, ref, out];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    if (!dest) dest = {};
    if (mapped[1] > -1) ctx.refs.set(mapped[1], dest);
    for (const key in mapped[2]) {
      const deserialized = ctx.deserialize(mapped[2][key], dest[key], ctx);
      if (deserialized !== undefined) dest[key] = deserialized;
    }
    return dest;
  }
}