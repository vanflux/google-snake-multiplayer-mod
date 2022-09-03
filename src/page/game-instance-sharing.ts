import { gameInstance, gameInstanceCtxKey, Header, lastGameRenderCtx, Menu, PlayerRenderer, Settings, SnakeBodyConfig, Vector2 } from "./hooks/game-hook";

export function createOtherGameInstance() {
  const otherInstance: any = {};
  const otherRenderer: any = new PlayerRenderer(otherInstance, lastGameRenderCtx.settings, lastGameRenderCtx[gameInstanceCtxKey]);

  const div = () => document.createElement('div');
  const canvas = () => document.createElement('canvas');
  const settings = new Settings(div());
  const menu = new Menu(settings, div(), div(), canvas(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());
  const header = new Header(settings, div(), div(), div(), div(), div(), div(), div(), div(), div(), div(), div());

  const aux = {
    ...gameInstance,
    settings,
    menu,
    header,
    [gameInstanceCtxKey]: document.createElement('canvas').getContext('2d'),
  };

  Object.assign(otherInstance, aux);
  console.log('[GSM] Other game instance:', otherInstance);

  return {otherRenderer, otherInstance}
}

export function updateOtherGameInstance(otherInstance: any, data: any) {
  deepUpdateObject(otherInstance, data, gameInstance);
}

export function deepUpdateObject(dest: any, src: any, fallback: any, already = new Set<any>()) {
  if (typeof src === 'object') {
    if (src == null) {
      return src;
    } else {
      if (already.has(src)) return dest;
      already.add(src);

      if (dest instanceof Vector2 || src instanceof Vector2 || fallback instanceof Vector2) {
        if (dest) {
          dest.x = src.x;
          dest.y = src.y;
        } else {
          dest = new Vector2(src.x, src.y);
        }
      } else if (dest instanceof SnakeBodyConfig || fallback instanceof SnakeBodyConfig) {
        for (const key in fallback) {
          dest[key] = deepUpdateObject(dest[key], src[key], fallback?.[key], already);
        }
      } else if (dest instanceof Settings ||fallback instanceof Settings) {
        for (const key in fallback) {
          dest[key] = deepUpdateObject(dest[key], src[key], fallback?.[key], already);
        }
      } else if (Array.isArray(src)) {
        if (dest == null) dest = [];
        dest.length = src.length;
        for (let i = 0; i < src.length; i++) {
          dest[i] = deepUpdateObject(dest[i], src[i], fallback?.[i], already);
        }
      } else {
        if (dest == null) dest = {};
        for (const key in src) {
          dest[key] = deepUpdateObject(dest[key], src[key], fallback?.[key], already);
        }
      }
      return dest;
    }
  }
  if (typeof src === 'function') return dest;
  return src ?? dest ?? fallback;
}

export function renderOtherGameInstance(otherRenderer: any, otherInstance: any, resolution: any) {
  otherRenderer.render(otherInstance.renderPart, true, resolution);
}
