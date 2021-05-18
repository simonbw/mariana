import { shuffle } from "../../../core/util/Random";
import { TilePos } from "../../../core/util/TilePos";

export class TileList {
  private tiles: TilePos[] = [];
  constructor(tiles: TilePos[]) {
    this.tiles.push(...tiles);

    shuffle(this.tiles);
  }

  get size() {
    return this.tiles.length;
  }

  add(...tile: TilePos[]) {
    this.tiles.push(...tile);

    shuffle(this.tiles);
  }

  pop(): TilePos | undefined {
    return this.tiles.pop();
  }

  take(n: number): TilePos[] {
    const result = [];
    while (n > 0 && this.tiles.length > 0) {
      result.push(this.tiles.pop()!);
      n -= 1;
    }
    return result;
  }
}
