
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
      console.error('[GSM] Detour error', fnKey, exc);
    }
    return original.call(this, ...args);
  };
  return () => (obj[fnKey] = original);
}
