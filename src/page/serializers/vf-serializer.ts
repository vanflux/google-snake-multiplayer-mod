import { Settings, SnakeBodyConfig, Vector2 } from "../hooks/game-hook";

export function vfSerialize(obj: any) {
  const refs = new Map<any, number>();
  const skipped = new Set<string>();
  return {data: serialize(obj, refs, skipped), skipped};
}

const simpleMapper = (obj: any) => obj;
const arrayMapper = (obj: any[], refs: Map<any, number>, skipped: Set<string>) => (
  obj.map(item => serialize(item, refs, skipped))
);
const objectMapper = (obj: any, refs: Map<any, number>, skipped: Set<string>) => {
  const out: any = {};
  for (const key in obj) {
    const serialized = serialize(obj[key], refs, skipped);
    if (serialized) out[key] = serialized;
  }
  return out;
}

function serialize(obj: any, refs: Map<any, number>, skipped: Set<string>): any {
  const mappers = new Map<string, any>([
    ['Number', simpleMapper],
    ['String', simpleMapper],
    ['Boolean', simpleMapper],
  
    ['Array', arrayMapper],
  
    [Settings.name, objectMapper],
    [SnakeBodyConfig.name, objectMapper],
    [Vector2.name, objectMapper],
    ['s_Jue', objectMapper],
    ['Set', objectMapper],
    ['Map', objectMapper],
    ['Object', objectMapper],
  ]);
  
  let ref = -1;
  if (typeof obj === 'object') {
    if (obj == null) return ['null', -1, null];
    if (refs.has(obj)) return ['ref', -1, refs.get(obj)];
    ref = refs.size;
    refs.set(obj, ref);
  }
  const name = obj?.constructor?.name;
  const mapper = mappers.get(name);
  if (mapper) {
    const out = mapper?.(obj, refs, skipped);
    if (out !== undefined) return [name, ref, out];
  } else {
    skipped.add(name);
  }
}
