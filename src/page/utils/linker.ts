import { LinkerDifferValueCountFoundException } from "../../common/exceptions/linker-differ-value-count-found.exception";
import { LinkerMultipleFunctionFoundException } from "../../common/exceptions/linker-multiple-function-found.exception";
import { LinkerMultipleMethodFoundException } from "../../common/exceptions/linker-multiple-method-found.exception";
import { LinkerMultipleValueFoundException } from "../../common/exceptions/linker-multiple-value-found.exception";
import { LinkerNoFunctionFoundException } from "../../common/exceptions/linker-no-function-found.exception";
import { LinkerNoMethodFoundException } from "../../common/exceptions/linker-no-method-found.exception";
import { LinkerNoValueFoundException } from "../../common/exceptions/linker-no-value-found.exception";

class LinkerBase {
  constructor(
    public jsObj: any,
    public parentJsObj: any,
    public code: string,
    public name: string,
    public type: 'class' | 'function' | 'method',
  ) {}
}

class LinkerHelper {
  private objs!: LinkerBase[];
  
  public setup() {
    try {
      const start = Date.now();
      console.log('[GSM] Linker Helper Setup');
      this.objs = [];
      for (const key in window) {
        if (!key.startsWith('s_') && !key.startsWith('S_')) continue;
        try {
          const obj: any = window[key as any];
          if (typeof obj === 'function' || (typeof obj === 'object' && obj !== null)) {
            if (typeof obj.prototype === 'object') {
              const functiom = new LinkerBase(obj, obj, obj.toString(), key, 'function');
              this.objs.push(functiom);
              
              const code = obj.toString();
              const clazz = new LinkerBase(obj, obj, code, key, 'class');
              this.objs.push(clazz);
              const alreadyReadMethods = new Set();
              for (const subKey of Object.getOwnPropertyNames(obj.prototype)) {
                if (subKey === 'constructor') continue;
                try {
                  const fn = obj.prototype[subKey];
                  if (typeof fn === 'function') {
                    if (alreadyReadMethods.has(fn)) continue;
                    alreadyReadMethods.add(fn);
                    this.objs.push(new LinkerBase(fn, obj, fn.toString(), subKey, 'method'));
                  }
                } catch {}
              }
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

  public findClassByMethod(
    rawName: string | RegExp,
    paramCount: number[],
    containList: RegExp[],
  ) {
    const methods = this.objs.filter(x => x.type === 'method' && x.name.match(rawName) && paramCount.includes(x.jsObj.length) && containList.every(y => x.code.match(y)));
    if (methods.length === 0) throw new LinkerNoMethodFoundException({ rawName, paramCount, containList });
    if (methods.length > 1) throw new LinkerMultipleMethodFoundException({ rawName, paramCount, containList });
    return methods[0].parentJsObj;
  }

  public findMethodName(
    classJsObj: any,
    rawName: string | RegExp,
    paramCount: number[],
    containList: RegExp[],
  ) {
    const methods = this.objs.filter(x => x.parentJsObj === classJsObj && x.type === 'method' && x.name.match(rawName) && paramCount.includes(x.jsObj.length) && containList.every(y => x.code.match(y)));
    if (methods.length === 0) throw new LinkerNoMethodFoundException({ classJsObjName: classJsObj?.name, rawName, paramCount, containList });
    if (methods.length > 1) throw new LinkerMultipleMethodFoundException({ classJsObjName: classJsObj?.name, rawName, paramCount, containList });
    return methods[0].name;
  }

  public findFunction(
    rawName: string | RegExp,
    paramCount: number[],
    containList: RegExp[],
  ) {
    if (!Array.isArray(paramCount)) paramCount = [paramCount];
    const functions = this.objs.filter(x => x.type === 'function' && x.name.match(rawName) && paramCount.includes(x.jsObj.length) && containList.every(y => x.code.match(y)));
    if (functions.length === 0) throw new LinkerNoFunctionFoundException({ rawName, paramCount, containList });
    if (functions.length > 1) throw new LinkerMultipleFunctionFoundException({ rawName, paramCount, containList });
    return functions[0].jsObj;
  }

  public findValues(regex: RegExp, expected: number, type?: LinkerBase['type'], parent?: any) {
    const matches = this.objs.map(obj => (type === undefined || obj.type === type) && (parent === undefined || obj.parentJsObj === parent) && obj.code.match(regex)).filter(Boolean) as string[][];
    if (matches.length === 0) throw new LinkerNoValueFoundException({ regex, expected, type, parentName: parent?.name });
    if (matches.length > 1) throw new LinkerMultipleValueFoundException({ regex, expected, type, parentName: parent?.name });
    if (matches[0].length !== expected + 1) throw new LinkerDifferValueCountFoundException({ regex, expected, type, parentName: parent?.name });
    return matches[0]!.slice(1);
  }
  
  public findValue(regex: RegExp, type?: LinkerBase['type'], parent?: any) {
    return this.findValues(regex, 1, type, parent)[0];
  }

  public proxyProp(obj: any, name: string, rawName: string) {
    Object.defineProperties(obj.prototype, {
      [name!]: {
        get: function () { return this[rawName] },
        set: function (value) { return this[rawName] = value },
        configurable: true,
      },
    });
  }

  public createProxyFactory<T>(config: ProxyConfig<T>) {
    return function createProxy(dest: any, _config=config): T {
      for (const name in _config.maps) {
        const subConfig = _config.maps[name];
        if (Object.keys(subConfig.maps || {}).length > 0) {
          createProxy(dest[name], subConfig);
        } else {
          if (dest?.hasOwnProperty(name)) continue;
          if (subConfig.rawName === name) continue;
          Object.defineProperty(dest, name, {
            get: () => dest[subConfig.rawName!],
            set: (v) => dest[subConfig.rawName!] = v,
            configurable: true,
          });
        }
      }
      return dest;
    };
  }
}

interface ProxyConfig<T> {
  rawName?: string;
  maps?: {[name: string]: ProxyConfig<T>};
}

export const linkerHelper = new LinkerHelper();
