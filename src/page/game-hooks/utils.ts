
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

export type DetourFn = (this: any, ...args: any) => (void | undefined | { return?: any });

export function detour(
  obj: any,
  fnKey: string,
  beforeFn?: DetourFn,
  afterFn?: DetourFn,
) {
  const originalFnKey = `___o${fnKey}`;
  const beforeFnListKey = `___b${fnKey}`;
  const afterFnListKey = `___a${fnKey}`;
  const isFirst = !obj[originalFnKey];
  const originalFn = obj[originalFnKey] = (obj[originalFnKey] || obj[fnKey]);
  const beforeFnList: DetourFn[] = obj[beforeFnListKey] = (obj[beforeFnListKey] || []);
  const afterFnList: DetourFn[] = obj[afterFnListKey] = (obj[afterFnListKey] || []);
  beforeFn && beforeFnList.push(beforeFn);
  afterFn && afterFnList.push(afterFn);

  if (isFirst) {
    obj[fnKey] = function (...args: any) {
      try {
        for (const detourFn of beforeFnList) {
          const result = detourFn.call(this, ...args);
          if (result && result.hasOwnProperty('return')) return result.return;
        }
      } catch(exc) {
        console.error('[GSM] Detour before fn list error', fnKey, exc);
      }
      const result = originalFn.call(this, ...args);
      try {
        for (const detourFn of afterFnList) {
          const result = detourFn.call(this, ...args);
          if (result && result.hasOwnProperty('return')) return result.return;
        }
      } catch(exc) {
        console.error('[GSM] Detour after fn list error', fnKey, exc);
      }
      return result;
    };
  }
  return () => {
    beforeFn && beforeFnList.splice(beforeFnList.indexOf(beforeFn), 1);
    afterFn && afterFnList.splice(afterFnList.indexOf(afterFn), 1);
    if (beforeFnList.length === 0 && afterFnList.length === 0) {
      obj[fnKey] = originalFn;
      delete obj[originalFnKey];
    }
  };
}
