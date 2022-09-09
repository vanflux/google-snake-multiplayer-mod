
declare module "*.css";

declare var VERSION: string;

declare interface Window {
  cleanup?(): void;
  snakeLoop?: boolean;
}

declare type Class = { new(...args: any[]): any; };

declare var GameEngine: Class;
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
