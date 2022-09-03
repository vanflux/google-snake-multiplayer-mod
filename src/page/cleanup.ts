
const fns: (()=>any)[] = [];

export function addCleanupFn(fn: ()=>any) {
  fns.push(fn);
}

export function cleanup() {
  console.log('[GSM] Cleanup');
  fns.forEach(fn => fn());
}
