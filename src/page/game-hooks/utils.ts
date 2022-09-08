export function findClassByMethod(
  name: string | RegExp,
  paramCount: number,
  fn: (body: string) => boolean
): any {
  const res = Object.entries<any>(window)
    .flatMap(([k, v]) => {
      try {
        return Object.getOwnPropertyNames(v.prototype)
          .filter(sK => {
            if (sK === 'constructor') return;
            return sK.match(name) && v.prototype[sK].length === paramCount && fn(v.prototype[sK].toString());
          })
          .map((x) => window[k as any]);
      } catch {}
      return [];
    })
    .filter((x) => x.length > 0);
  if (res.length < 1)
    throw new Error(
      `No methods found for: ${name} ${paramCount} ${fn.toString()}.`
    );
  if (res.length > 1)
    throw new Error(
      `More than 1 method was found for: ${name} ${paramCount} ${fn.toString()}.`
    );
  return res[0];
}

export function findChildKeysInObject(obj: any, fn: (child: any) => boolean) {
  return Object.getOwnPropertyNames(obj).filter(k => {
    if (k === 'constructor') return;
    try {
      return fn(obj[k]);
    } catch {}
  });
}

export function findChildKeyInObject(obj: any, fn: (child: any) => boolean) {
  const keys = findChildKeysInObject(obj, fn);
  if (keys.length > 1) throw new Error(
    `More than 1 child was found for: ${obj} ${fn.toString()}.`
  );
  return keys[0];
}

export function detour(
  obj: any,
  fnKey: string,
  detourFn: (this: any, ...args: any) => any
) {
  const original = obj[fnKey];
  obj[fnKey] = function (...args: any) {
    try {
      if (detourFn.call(this, ...args)) return;
    } catch(exc) {
      console.error('Detour error', fnKey, exc);
    }
    return original.call(this, ...args);
  };
  return () => (obj[fnKey] = original);
}

export function transformObject(obj: any, transform: (...args: any) => any = x=>x) {
  const newObj: any = {};
  for (const key in obj) newObj[key] = transform(obj[key]);
  return newObj;
}

export function extractSubObject(obj: any, keys: string[], transform: (...args: any) => any = x=>x) {
  const newObj: any = {};
  for (const key of keys) newObj[key] = transform(obj[key]);
  return newObj;
}

export type Class = { new(...args: any[]): any; };
