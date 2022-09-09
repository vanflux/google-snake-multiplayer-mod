class ObfuscationClass {
  private name?: string;

  constructor(
    private rawName: string,
    private jsObj: Class,
    private methods: ObfuscationMethod[],
  ) {}

  public getRawName() {
    return this.rawName;
  }

  public getName() {
    return this.name;
  }

  public getMethods() {
    return this.methods;
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public get() {
    return this.jsObj;
  }

  public findMethod(
    rawName: string | RegExp,
    paramCount?: number,
    containList: RegExp[] = [],
  ) {
    const methods = this.methods.filter(x => x.getRawName().match(rawName) && (paramCount === undefined || x.getParamCount() === paramCount) && containList.every(y => x.contains(y)));
    if (methods.length === 0) throw new Error('No methods was found on class!');
    if (methods.length > 1) throw new Error('More than 1 method was found on class!');
    return methods[0];
  }

  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Obfuscation Helper Linking "' + this.getRawName() + '" class as "' + this.getName() + '"');
    const obj: any = this.get();
    for (const method of this.methods) {
      if (method.getName() === undefined) continue;
      console.log('[GSM] Obfuscation Helper Linking "' + this.getRawName() + '.' + method.getRawName() + '" method as "' + method.getRawName() + '" as "' + method.getName() + '"');
      obj.prototype[method.getName()!] = obj.prototype[method.getRawName()];
    }
    window[this.getName() as any] = obj;
    
    // FIXME: Create classes prototype fields with name linked to rawName (a getter to rawName and setter to rawName)
  }
}

class ObfuscationMethod {
  private name?: string;

  constructor(
    private rawName: string,
    private paramCount: number,
    private parentClass: ObfuscationClass,
    private code: string,
    private jsObj: (...args: any) => any,
  ) {}

  public getRawName() {
    return this.rawName;
  }

  public getName() {
    return this.name;
  }

  public getParamCount() {
    return this.paramCount;
  }

  public parent() {
    return this.parentClass;
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public get() {
    return this.jsObj;
  }

  public contains(regex: RegExp) {
    return !!this.code.match(regex);
  }

  public findValues(regex: RegExp) {
    return this.code.match(regex)?.slice(1) ?? undefined;
  }
}

class ObfuscationHelper {
  private classes!: ObfuscationClass[];
  
  public setup() {
    try {
      const start = Date.now();
      console.log('[GSM] Obfuscation Helper Setup');
      this.classes = [];
      for (const key in window) {
        if (!key.startsWith('s_') && !key.startsWith('S_')) continue;
        try {
          const obj: any = window[key as any];
          if (typeof obj === 'function' || (typeof obj === 'object' && obj !== null)) {
            if (typeof obj.prototype === 'object') {
              const methods: ObfuscationMethod[] = [];
              const clazz = new ObfuscationClass(key, obj, methods);
              const alreadyReadMethods = new Set();
              for (const subKey of Object.getOwnPropertyNames(obj.prototype)) {
                if (subKey === 'constructor') continue;
                try {
                  const fn = obj.prototype[subKey];
                  if (typeof fn === 'function') {
                    if (alreadyReadMethods.has(fn)) continue;
                    alreadyReadMethods.add(fn);
                    methods.push(new ObfuscationMethod(subKey, fn.length, clazz, fn.toString(), fn));
                  }
                } catch {}
              }
              this.classes.push(clazz);
            }
          }
        } catch {}
      }
      const end = Date.now();
      console.log('[GSM] Obfuscation Helper Setup Took', end-start, 'ms');
    } catch (exc) {
      console.error('[GSM] Obfuscation Helper Error:', exc);
    }
  }

  public findMethod(
    rawName: string | RegExp,
    paramCount: number,
    containList: RegExp[],
  ) {
    const methods = this.classes.flatMap(c => c.getMethods().filter(x => x.getRawName().match(rawName) && x.getParamCount() === paramCount && containList.every(y => x.contains(y)))).filter(Boolean);
    if (methods.length === 0) throw new Error('No methods was found on class!');
    if (methods.length > 1) throw new Error('More than 1 method was found on class!');
    return methods[0];
  }
}

export const obfuscationHelper = new ObfuscationHelper();

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
