import { TilePos } from "../world/TilePos";

/** Get all the tiles in the box centered at CX, CY */
export function makeNeighbors(
  [cx, cy]: TilePos,
  width: number = 1,
  height: number = 1
): TilePos[] {
  return makeBox(cx - width, cx + width, cy - height, cy + height);
}

/** Get all the tiles in the box centered at CX, CY */
export function makeBox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): TilePos[] {
  const result: TilePos[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      result.push([x, y]);
    }
  }
  return result;
}

export function rasterizeCircle(cx: number, cy: number, r: number): TilePos[] {
  const result: TilePos[] = [];

  return result;
}
