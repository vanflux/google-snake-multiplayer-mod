import { Mapper, SerializationCtx } from "../vf-serializer";

export class ArrayMapper implements Mapper {
  id = 3;

  types = ['Array'];

  map(unmapped: any[], ctx: SerializationCtx) {
    const ref = ctx.refs.size;
    return [this.id, ref, unmapped.map(item => ctx.serialize(item, ctx))];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    if (!dest) dest = [];
    if (mapped[1] > -1) ctx.refs.set(mapped[1], dest);
    const data: any[] = mapped[2];
    dest.length = data.length;
    data.forEach((_,i) => dest[i] = ctx.deserialize(data[i], dest[i], ctx));
    return dest;
  }
}
