export type VFSerializer = ReturnType<typeof buildVfSerializer>;

export interface SerializationCtx {
  refs: Map<any, number>;
  skipped: Set<string>;
  mappers: Map<string, Mapper>;
  serialize: typeof serialize,
  deserialize: typeof deserialize,
}

export interface Mapper {
  name: string;
  types: string[];
  map(unmapped: any, ctx: SerializationCtx): any;
  unmap(mapped: any, dest: any, ctx: SerializationCtx): any;
}

export function buildVfSerializer(mapperList: Mapper[]) {
  const mappersByName = new Map(mapperList.map(mapper => [mapper.name, mapper]));
  const mappersByType = new Map(mapperList.flatMap(mapper => mapper.types.map(type => [type, mapper])));

  return {
    serialize: (obj: any) => {
      const refs = new Map<any, number>();
      const skipped = new Set<string>();
      const ctx = { refs, skipped, mappers: mappersByType, serialize, deserialize };
      return {data: serialize(obj, ctx), skipped};
    },
    deserialize: (obj: any, dest: any) => {
      const refs = new Map<any, number>();
      const skipped = new Set<string>();
      const ctx = { refs, skipped, mappers: mappersByName, serialize, deserialize };
      return {data: deserialize(obj, dest, ctx), skipped};
    },
  };
}

function serialize(obj: any, ctx: SerializationCtx): any {
  let ref = -1;
  if (typeof obj === 'object') {
    if (obj == null) return ['null', -1, null];
    if (ctx.refs.has(obj)) return ['ref', -1, ctx.refs.get(obj)];
    ref = ctx.refs.size;
    ctx.refs.set(obj, ref);
  }
  const constructorName = obj?.constructor?.name;
  const mapper = ctx.mappers.get(constructorName) ;
  if (mapper) {
    const out = mapper.map(obj, ctx);
    if (out !== undefined) return out;
  } else {
    ctx.skipped.add(constructorName);
  }
}

function deserialize(obj: any, dest: any, ctx: SerializationCtx): any {
  const [constructorName, ref,mapped] = obj;
  if (constructorName === 'ref') return ctx.refs.get(mapped);
  if (constructorName === 'null') return null;

  const mapper = ctx.mappers.get(constructorName);
  if (mapper) {
    return mapper.unmap(obj, dest, ctx);
  } else {
    ctx.skipped.add(constructorName);
  }
}
