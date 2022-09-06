import { Mapper, SerializationCtx } from "../vf-serializer";

export class SimpleMapper implements Mapper {
  id = 5;

  types = ['Number', 'Boolean', 'String'];

  map(unmapped: any, ctx: SerializationCtx) {
    return [this.id, unmapped];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    return mapped[1];
  }
}
