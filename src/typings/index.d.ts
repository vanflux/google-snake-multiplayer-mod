declare module "*.css";

declare var VERSION: string;

declare interface Window {
  cleanup?(): void;
  snakeLoop?: boolean;
  GameEngine: typeof GameEngine;
  GameInstance: typeof GameInstance;
  Vector2: typeof Vector2;
  BoardRenderer: typeof BoardRenderer;
  PlayerRenderer: typeof PlayerRenderer;
  Settings: typeof Settings;
  Menu: typeof Menu;
  Header: typeof Header;
  MapObjectHolder: typeof MapObjectHolder;
  SnakeBodyConfig: typeof SnakeBodyConfig;
  GameClass1: typeof GameClass1;
  AssetRenderer: typeof AssetRenderer;
}

// Game classes
declare class GameEngine {
  public render(a: number, b: number);
}

declare class GameInstance {
  public xaa: number; // TODO: better naming
  public saa: number; // TODO: better naming
  public headState: number; // TODO: check
  public snakeBodyConfig: SnakeBodyConfig;
  public gameClass1: GameClass1;
  public mapObjectHolder: MapObjectHolder;
  public lastInvencibilityTime: number; // Mod variable
  public latency: number; // Mod variable
  public receivedData: boolean; // Mod variable
  constructor(settings: Settings, menu: Menu, header: Header);
  public update(time: number);
  public checkDeathCollision(pos: Vector2);
  public die();
  public reset();
}

declare class Vector2 {
  public x: number;
  public y: number;
  constructor(x: number, y: number);
  public clone(): Vector2;
  public equals(other: Vector2): boolean;
}

declare class BoardRenderer {
  public canvasCtx: CanvasRenderingContext2D;
}

declare class PlayerRenderer {
  public canvasCtx: CanvasRenderingContext2D;
  public instance: GameInstance;
  constructor(gameInstance: GameInstance, settings: Settings, canvasCtx: CanvasRenderingContext2D);
  public render(renderPart: number, b1: boolean, resolution: { width: number, height: number });
}

declare class Settings {
  constructor(elem: HTMLElement);
}

declare class Menu {
  constructor(settings: Settings, ...elements: HTMLElement[]);
}

declare class Header {
  constructor(settings: Settings, ...elements: HTMLElement[]);
}

declare class MapObjectHolder {
  public objs: Collectable[];
}

declare class SnakeBodyConfig {
  public headState: number; // TODO: check
  public bodyPoses: Vector2[];
  public tailPos: Vector2;
  public direction: string;
  public oldDirection: string;
  public directionChanged: boolean; // true -> changed
  public deathHeadState: number; // discrete numbers
  public color1: string; // hex
  public color2: string; // hex
}

declare class GameClass1 {
  
}

declare class AssetRenderer {
  
}

// Game types
interface Collectable {
  public position: Vector2;
  public animationStep: number;
  public type: number;
  public appearing: boolean;
  public velocity: Vector2;
  public f6: Vector2;
  public isPoisoned: boolean;
  public isGhost: boolean;
}

// Game functions
declare function changeAssetColor(assetRenderer: AssetRenderer, color: string, c?: any, d?: any): void;

// Proxies
declare function createCollectableProxy(collectable: Collectable): Collectable;
