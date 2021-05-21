import { shuffle } from "../../../core/util/Random";
import { tileEquals, TilePos } from "../../../core/util/TilePos";

type TileFilter = (tilePos: TilePos) => boolean;
export class TileList {
  private tiles: TilePos[] = [];
  constructor(tiles: TilePos[]) {
    this.tiles.push(...tiles);

    shuffle(this.tiles);
  }

  get size() {
    return this.tiles.length;
  }

  add(...tilePositions: TilePos[]) {
    this.tiles.push(...tilePositions);

    shuffle(this.tiles);
  }

  remove(...toRemove: TilePos[]) {
    this.tiles = this.tiles.filter(
      (a) => !toRemove.some((b) => tileEquals(a, b))
    );
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

  popFiltered(filter: TileFilter): TilePos | undefined {
    return this.takeFiltered(1, filter)[0];
  }

  takeFiltered(n: number, filter: TileFilter): TilePos[] {
    const result: TilePos[] = [];
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const tilePos = this.tiles[i];
      if (filter(tilePos)) {
        this.tiles.splice(tilePos[i], 1);
        result.push(tilePos);

        if (result.length >= n) {
          break;
        }
      }
    }
    shuffle(this.tiles); // to keep the rest well balanced
    return result;
  }
}
