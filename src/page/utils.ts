export function findClassByMethod(
  name: string | RegExp,
  paramCount: number,
  fn: (body: string) => boolean
): any {
  const res = Object.entries<any>(window)
    .flatMap(([k, v]) => {
      try {
        return Object.entries<any>(v.prototype)
          .filter(([sK, sV]) => {
            return sK.match(name) && sV.length === paramCount && fn(sV.toString());
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

export function findChildKeyInObject(obj: any, fn: (child: any) => boolean) {
  const res = Object.entries<any>(obj).filter(([k, v]) => {
    try {
      return fn(v);
    } catch {}
  });
  if (res.length < 1)
    throw new Error(`No child found for: ${obj} ${fn.toString()}.`);
  if (res.length > 1)
    throw new Error(
      `More than 1 child was found for: ${obj} ${fn.toString()}.`
    );
  return res[0][0];
}

export function findChildKeysInObject(obj: any, fn: (child: any) => boolean) {
  const res = Object.entries<any>(obj).filter(([k, v]) => {
    try {
      return fn(v);
    } catch {}
  });
  return res.map(x => x[0]);
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
