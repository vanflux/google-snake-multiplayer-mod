declare module "*.css";

declare var VERSION: string;
declare var DEFAULT_SERVER_URL: string;

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

// Regex patch
declare interface RegExp {
  toJSON(): string;
}

// Game classes
declare class GameEngine {
  public render(a: number, b: number);
  public skipTutorial();
  public reset(isModControlled?: boolean);
}

declare class GameInstance {
  public xaaDelta: number;
  public xaa: number; // TODO: better naming
  public saa: number; // TODO: better naming
  public headState: boolean;
  public snakeBodyConfig: SnakeBodyConfig;
  public gameClass1: GameClass1;
  public mapObjectHolder: MapObjectHolder;
  public ready: boolean; // Mod variable
  public invencible: boolean; // Mod variable
  public invencibleStartTime: number; // Mod variable
  public latency: number; // Mod variable
  public receivedData: boolean; // Mod variable
  constructor(settings: Settings, menu: Menu, header: Header);
  public update(time: number);
  public tick();
  public checkDeathCollision(pos: Vector2);
  public die();
  public reset(isModControlled?: boolean);
  public collectAndSpawnNextCollectable(a?: any, b?: any, c?: any);
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
  public light: number;
}

// Game functions
declare function changeAssetColor(assetRenderer: AssetRenderer, color: string, c?: any, d?: any): void;
declare function spawnCollectableAt(a?: any, b?: any, pos: Vector2): void;

// Proxies
declare function createCollectableProxy(collectable: Collectable): Collectable;
