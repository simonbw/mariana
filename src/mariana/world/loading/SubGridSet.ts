import { SubGrid } from "./SubGrid";
import { TilePos } from "../TilePos";

// A union of rectangular sections of grid
export default class SubGridSet implements Iterable<TilePos> {
  data: SubGrid[] = [];

  add(subGrid: SubGrid): void {
    this.data.push(subGrid);
  }

  has(cell: TilePos): boolean {
    return this.data.some((subGrid) => subGrid.has(cell));
  }

  [Symbol.iterator](): Iterator<TilePos> {
    return this.values();
  }

  /** Returns the tiles in this set that aren't in other */
  // TODO: can this be faster
  difference(other: SubGridSet): Iterable<TilePos> {
    const result: TilePos[] = [];
    for (const tile of this.getValues()) {
      if (!other.has(tile)) {
        result.push(tile);
      }
    }
    return result;
  }

  *values(): Iterator<TilePos> {
    for (let i = 0; i < this.data.length; i++) {
      const subGrid = this.data[i];
      for (const cell of subGrid) {
        // We can skip this for loop if we're ok with iterating over the same cell multiple times
        for (let j = 0; j < i; j++) {
          if (this.data[j].has(cell)) {
            // This cell has been reported previously
            continue;
          }
        }
        yield cell;
      }
    }
  }

  // same as values() but not a generator, seems to be faster, maybe?
  getValues(): TilePos[] {
    const result: TilePos[] = [];
    for (let i = 0; i < this.data.length; i++) {
      const subGrid = this.data[i];
      for (const cell of subGrid.values()) {
        // We can skip this for loop if we're ok with iterating over the same cell multiple times
        for (let j = 0; j < i; j++) {
          if (this.data[j].has(cell)) {
            // This cell has been reported previously
            continue;
          }
        }
        result.push(cell);
      }
    }

    return result;
  }
}
