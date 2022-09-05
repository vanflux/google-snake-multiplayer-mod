import { Mapper, SerializationCtx } from "../vf-serializer";

export class SimpleMapper implements Mapper {
  name = 'simple';

  types = ['Number', 'Boolean', 'String'];

  map(unmapped: any, ctx: SerializationCtx) {
    return [this.name, -1, unmapped];
  }

  unmap(mapped: any, dest: any, ctx: SerializationCtx) {
    return mapped[2];
  }
}
