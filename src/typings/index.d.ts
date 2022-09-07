
declare module "*.css";

declare interface Window {
  cleanup?(): void;
  snakeLoop?: boolean;
}
