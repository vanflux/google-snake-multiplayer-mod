class LinkerClass {
  private name?: string;

  constructor(
    private rawName: string,
    private jsObj: Class,
    private methods: LinkerMethod[],
    private fields: LinkerField[],
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
    const field = new LinkerField(rawName, this);
    this.fields.push(field);
    return field;
  }

  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Linker Helper Linking "' + this.getRawName() + '" class as "' + this.getName() + '"');
    const obj: any = this.get();
    window[this.getName() as any] = obj;
    for (const method of this.methods) method.link();
    for (const field of this.fields) field.link();
  }
}

class LinkerFunction {
  private name?: string;

  constructor(
    private rawName: string,
    private paramCount: number,
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
    console.log('[GSM] Linker Helper Linking "' + this.getRawName() + '" function as "' + this.getName() + '"');
    window[this.getName() as any] = window[this.getRawName() as any];
  }
}

class LinkerMethod {
  private name?: string;

  constructor(
    private rawName: string,
    private paramCount: number,
    private parentClass: LinkerClass,
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
    console.log('[GSM] Linker Helper Linking "' + this.parent().getRawName() + '.' + this.getRawName() + '" method as "' + this.getRawName() + '" as "' + this.getName() + '"');
    const obj = this.parent().get();
    obj.prototype[this.getName()!] = obj.prototype[this.getRawName()];
  }
}

class LinkerField {
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
    private parentClass: LinkerClass,
  ) {}

  
  public link() {
    if (this.getName() === undefined) return;
    console.log('[GSM] Linker Helper Linking "' + this.parent().getRawName() + '.' + this.getRawName() + '" as "' + this.getName() + '"');
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

class LinkerHelper {
  private classes!: LinkerClass[];
  private functions!: LinkerFunction[];
  
  public setup() {
    try {
      const start = Date.now();
      console.log('[GSM] Linker Helper Setup');
      this.classes = [];
      this.functions = [];
      for (const key in window) {
        if (!key.startsWith('s_') && !key.startsWith('S_')) continue;
        try {
          const obj: any = window[key as any];
          if (typeof obj === 'function' || (typeof obj === 'object' && obj !== null)) {
            if (typeof obj.prototype === 'object') {
              const functiom = new LinkerFunction(key, obj.length, obj.toString(), obj);
              this.functions.push(functiom);
              
              const methods: LinkerMethod[] = [];
              const fields: LinkerField[] = [];
              const code = obj.toString();
              const clazz = new LinkerClass(key, obj, methods, fields, code);
              const alreadyReadMethods = new Set();
              for (const subKey of Object.getOwnPropertyNames(obj.prototype)) {
                if (subKey === 'constructor') continue;
                try {
                  const fn = obj.prototype[subKey];
                  if (typeof fn === 'function') {
                    if (alreadyReadMethods.has(fn)) continue;
                    alreadyReadMethods.add(fn);
                    methods.push(new LinkerMethod(subKey, fn.length, clazz, fn.toString(), fn));
                  }
                } catch {}
              }
              this.classes.push(clazz);
            }
          }
        } catch {}
      }
      const end = Date.now();
      console.log('[GSM] Linker Helper Setup Took', end-start, 'ms');
    } catch (exc) {
      console.error('[GSM] Linker Helper Error:', exc);
    }
  }

  public findMethod(
    rawName: string | RegExp,
    paramCount: number,
    containList: RegExp[],
  ) {
    const methods = this.classes.flatMap(c => c.getMethods().filter(x => x.getRawName().match(rawName) && x.getParamCount() === paramCount && containList.every(y => x.contains(y)))).filter(Boolean);
    if (methods.length === 0) throw new Error('No methods were found on class!');
    if (methods.length > 1) throw new Error('More than 1 method was found on class!');
    return methods[0];
  }

  public findFunction(
    rawName: string | RegExp,
    paramCount: number|number[],
    containList: RegExp[],
  ) {
    if (!Array.isArray(paramCount)) paramCount = [paramCount];
    const functions = this.functions.filter(x => x.getRawName().match(rawName) && (paramCount as number[]).includes(x.getParamCount()) && containList.every(y => x.contains(y)));
    if (functions.length === 0) throw new Error('No functions were found on class!');
    if (functions.length > 1) throw new Error('More than 1 function was found on class!');
    return functions[0];
  }
}

export const linkerHelper = new LinkerHelper();
