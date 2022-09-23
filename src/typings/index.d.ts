declare module "*.css";

declare var VERSION: string;

declare interface Window {
  cleanup?(): void;
  snakeLoop?: boolean;
}

declare type Class = { new(...args: any[]): any; };

// Game classes
declare var GameEngine: Class;
declare var GameInstance: Class;
declare var Vector2: Class;
declare var BoardRenderer: Class;
declare var PlayerRenderer: Class;
declare var Settings: Class;
declare var Menu: Class;
declare var Header: Class;
declare var MapObjectHolder: Class;
declare var SnakeBodyConfig: Class;
declare var GameClass1: Class;
declare var AssetRenderer: Class;

// Game types
interface Collectable {
  f1: any;
  f2: any;
  f3: any;
  f4: any;
  f5: any;
  f6: any;
  f7: any;
  f8: any;
}

// Game functions
declare function changeAssetColor(assetRenderer: any, color: any, c?: any, d?: any): void;

// Proxies
declare function createCollectableProxy(collectable: Collectable): Collectable;
