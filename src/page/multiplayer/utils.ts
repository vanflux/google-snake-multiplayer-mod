
export function nextPosition(pos: Vector2, direction: string) {
  switch (direction) {
    case "LEFT": return new Vector2(pos.x - 1, pos.y);
    case "RIGHT": return new Vector2(pos.x + 1, pos.y);
    case "UP": return new Vector2(pos.x, pos.y - 1);
    case "DOWN": return new Vector2(pos.x, pos.y + 1);
  }
  return pos.clone();
}
