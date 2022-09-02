
export function detour(obj: any, fnKey: string, detourFn: (...args: any) => void) {
    const original = obj[fnKey];
    obj[fnKey] = function (...args: any) {
        detourFn.call(this, ...args);
        return original.call(this, ...args);
    };
    return () => obj[fnKey] = original;
}
