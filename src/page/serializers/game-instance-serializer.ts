import { gameInstance, gameInstanceCtxKey, gameInstanceMapObjectHolderKey, Vector2 } from "../hooks/game-hook";
import { extractSubObject, findChildKeysInObject, transformObject } from "../utils";

export function serializeGameInstance(renderPart: number) {
  const isSimple = (x: any) => typeof x === 'boolean' || typeof x === 'number' || typeof x === 'string' || x.constructor.name === 'Object';
  const isVector2 = (x: any) => x instanceof Vector2;

  const typify = (type: string) => (data: any) => ({ type, data });
  const serializeSimple = (x: any) => typify('simple_object')(JSON.stringify(x));
  const serializeVector = (x: any) => typify('vector2')({ x: x.x, y: x.y });
  const serializeVectorArray = (x: any) => typify('vector2_array')(x.map(serializeVector));

  const childSimpleValueKeys = findChildKeysInObject(gameInstance, isSimple);
  const childSimpleArrayKeys = findChildKeysInObject(gameInstance, x => Array.isArray(x) && isSimple(x[0]));

  const oaSimpleValueKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], isSimple);
  const oaSimpleArrayKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], x => Array.isArray(x) && isSimple(x[0]));
  const oaVectorKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], isVector2);
  const oaVectorArrayKeys = findChildKeysInObject(gameInstance[gameInstanceCtxKey], x => Array.isArray(x) && isVector2(x[0]));

  const settingsSimpleValueKeys = findChildKeysInObject(gameInstance.settings, isSimple);
  const settingsSimpleArrayKeys = findChildKeysInObject(gameInstance.settings, x => Array.isArray(x) && isSimple(x[0]));

  return {
    ...(extractSubObject(gameInstance, childSimpleValueKeys, serializeSimple)),
    ...(extractSubObject(gameInstance, childSimpleArrayKeys, serializeSimple)),
    settings: typify('object')({
      ...(extractSubObject(gameInstance.settings, settingsSimpleValueKeys, serializeSimple)),
      ...(extractSubObject(gameInstance.settings, settingsSimpleArrayKeys, serializeSimple)),
    }),
    [gameInstanceCtxKey]: typify('object')({
      ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaSimpleValueKeys, serializeSimple)),
      ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaSimpleArrayKeys, serializeSimple)),
      ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaVectorKeys, serializeVector)),
      ...(extractSubObject(gameInstance[gameInstanceCtxKey], oaVectorArrayKeys, serializeVectorArray)),
    }),
    [gameInstanceMapObjectHolderKey]: typify('object')({
      //...(extractSubObject(gameInstance[gameInstanceMapObjectHolderKey], [gameInstanceMapObjectHolderObjsKey], serializeSimple)),
      // @ts-ignore
      //...(extractSubObject(gameInstance[gameInstanceMapObjectHolderKey], [gameInstanceMapObjectHolderObjsKey], serializeSimple)),
    }),
    renderPart: serializeSimple(renderPart),
  };
};

export function deserializeGameInstance(serializedData: any): any {
  return transformObject(serializedData, x => {
    if (x.type === 'object') return deserializeGameInstance(x.data);
    if (x.type === 'simple_object') return JSON.parse(x.data);
    if (x.type === 'vector2') return new Vector2(x.data.x, x.data.y);
    if (x.type === 'vector2_array') return x.data.map((x: any) => new Vector2(x.data.x, x.data.y));
    throw new Error('Unsupported deserialization!');
  });
};

