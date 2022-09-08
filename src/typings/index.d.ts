
declare module "*.css";

declare var VERSION: string;

declare interface Window {
  cleanup?(): void;
  snakeLoop?: boolean;
}
