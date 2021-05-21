export type TilePos = readonly [number, number];

export function tileEquals(a: TilePos, b: TilePos): boolean {
  return a[0] === b[0] && a[1] === b[1];
}
