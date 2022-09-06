export type VFSerializer = ReturnType<typeof buildVfSerializer>;

export const nullId = 0;
export const refId = 1;

export interface SerializationCtx {
  refs: Map<any, number>;
  mappersByType: Map<string, Mapper>;
  mappersById: Mapper[];
  serialize: (obj: any, ctx: SerializationCtx) => any[],
  deserialize: (obj: any, dest: any, ctx: SerializationCtx) => any,
}

export interface Mapper {
  id: number;
  types: string[];
  map(unmapped: any, ctx: SerializationCtx): any;
  unmap(mapped: any, dest: any, ctx: SerializationCtx): any;
}

export function buildVfSerializer(mapperList: Mapper[]) {
  const skipped = new Set<string>();
  const mappersById = mapperList.reduce((arr, mapper) => (arr[mapper.id] = mapper, arr), [] as Mapper[]);
  const mappersByType = new Map(mapperList.flatMap(mapper => mapper.types.map(type => [type, mapper])));

  const frontendSerialize = (obj: any) => {
    const refs = new Map<any, number>();
    const ctx = { refs, mappersByType, mappersById, serialize, deserialize };
    return {data: serialize(obj, ctx), skipped};
  };

  const frontendDeserialize = (obj: any, dest: any) => {
    const refs = new Map<any, number>();
    const ctx = { refs, mappersByType, mappersById, serialize, deserialize };
    return {data: deserialize(obj, dest, ctx), skipped};
  };
  
  const serialize = (obj: any, ctx: SerializationCtx): any => {
    let ref = -1;
    if (typeof obj === 'object') {
      if (obj == null) return [nullId];
      if (ctx.refs.has(obj)) return [refId, ctx.refs.get(obj)];
      ref = ctx.refs.size;
      ctx.refs.set(obj, ref);
    }
    const constructorName = obj?.constructor?.name;
    const mapper = ctx.mappersByType.get(constructorName) ;
    if (mapper) {
      const out = mapper.map(obj, ctx);
      if (out !== undefined) return out;
    } else {
      skipped.add(constructorName);
    }
  }

  const deserialize = (obj: any, dest: any, ctx: SerializationCtx): any => {
    const [mapperId,ref] = obj;
    if (mapperId === nullId) return null;
    if (mapperId === refId) return ctx.refs.get(ref);

    const mapper = ctx.mappersById[mapperId];
    if (mapper) {
      return mapper.unmap(obj, dest, ctx);
    } else {
      skipped.add(mapperId);
    }
  }
  
  return { serialize: frontendSerialize, deserialize: frontendDeserialize };
}
