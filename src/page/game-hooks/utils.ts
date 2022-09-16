class ObfuscationClass {
  private name?: string;

  constructor(
    private rawName: string,
    private jsObj: Class,
    private methods: ObfuscationMethod[],
    private fields: ObfuscationField[],
    private code: string,
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

  public findField(
    regex: RegExp,
  ) {
    let matches = this.code.match(regex);
    if (!matches && typeof this.jsObj === 'function') {
      for (const method of this.methods) {
        matches = method.getCode().match(regex);
        if (matches) break;
      }
    }
    if (!matches) throw new Error(`No matches were found on class using regex "${regex.toString()}"!`);
    if (matches.length < 2) throw new Error(`Find field regex must contain at least 1 group "${regex.toString()}"!`);
    const rawName = matches[1];
    if (this.fields.find(x => x.getRawName() === rawName)) throw new Error(`Found a duplicated field rawName using regex "${regex.toString()}"!`);
    const field = new ObfuscationField(rawName, this);
    this.fields.push(field);
    return field;
  }

  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Obfuscation Helper Linking "' + this.getRawName() + '" class as "' + this.getName() + '"');
    const obj: any = this.get();
    window[this.getName() as any] = obj;
    for (const method of this.methods) method.link();
    for (const field of this.fields) field.link();
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

  public getCode() {
    return this.code;
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
  
  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Obfuscation Helper Linking "' + this.parent().getRawName() + '.' + this.getRawName() + '" method as "' + this.getRawName() + '" as "' + this.getName() + '"');
    const obj = this.parent().get();
    obj.prototype[this.getName()!] = obj.prototype[this.getRawName()];
  }
}

class ObfuscationField {
  private name?: string;


  public getRawName() {
    return this.rawName;
  }

  public getName() {
    return this.name;
  }

  public parent() {
    return this.parentClass;
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  constructor(
    private rawName: string,
    private parentClass: ObfuscationClass,
  ) {}

  
  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Obfuscation Helper Linking "' + this.parent().getRawName() + '.' + this.getRawName() + '" field as "' + this.getRawName() + '" as "' + this.getName() + '"');
    const obj = this.parent().get();
    const self = this;
    Object.defineProperties(obj.prototype, {
      [this.name!]: {
        get: function () { return this[self.rawName] },
        set: function (value) { return this[self.rawName] = value },
        configurable: true,
      },
    });
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
              const fields: ObfuscationField[] = [];
              const code = obj.toString();
              const clazz = new ObfuscationClass(key, obj, methods, fields, code);
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
