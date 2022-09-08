class ObfuscationClass {
  constructor(
    private rawName: string,
    private name: string,
    private jsObj: Class,
    private methods: ObfuscationMethod[],
  ) {}

  public getRawName() {
    return this.rawName;
  }

  public getName() {
    return this.name;
  }

  public get() {
    return this.jsObj;
  }

  public findMethod(fn: (method: ObfuscationMethod) => boolean) {
    const methods = this.methods.filter(fn);
    if (methods.length > 1) throw new Error('More than 1 method was found on class!');
    return methods[0];
  }


}

class ObfuscationMethod {
  constructor(
    private rawName: string,
    private name: string,
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

  public matchRawName(rawName: string | RegExp) {
    return !!this.rawName.match(rawName);
  }

  public matchName(name: string | RegExp) {
    return !!this.name.match(name);
  }

  public hasParamCount(paramCount: number) {
    return this.paramCount === paramCount;
  }

  public parent() {
    return this.parentClass;
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
              const clazz = new ObfuscationClass(key, '', obj, methods);
              for (const subKey of Object.getOwnPropertyNames(obj.prototype)) {
                if (subKey === 'constructor') continue;
                try {
                  const fn = obj.prototype[subKey];
                  if (typeof fn === 'function') {
                    methods.push(new ObfuscationMethod(subKey, '', fn.length, clazz, fn.toString(), fn));
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

  public findMethod(fn: (method: ObfuscationMethod) => boolean) {
    const methods = this.classes.map(clazz => clazz.findMethod(fn)).filter(Boolean);
    if (methods.length > 1) throw new Error('More than 1 method was found on all classes! Raw Class Names: ' + methods.map(x => x.getRawName()).join(', '));
    return methods[0];
  }

  public deobfuscate() {
    // FIXME: Create functions with name linked to rawName ()
    // FIXME: Create classes with name linked to rawName (window.{name} = window.{rawName})
    // FIXME: Create classes prototype fields with name linked to rawName (a getter to rawName and setter to rawName)
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

export type Class = { new(...args: any[]): any; };
