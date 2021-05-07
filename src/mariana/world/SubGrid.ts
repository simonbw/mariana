import { TilePos } from "./TilePos";

// A rectangular subsection of a grid
export class SubGrid {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {

  }

  has(cell: TilePos): boolean {
    const [x, y] = cell;
    return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height;
  }
  
  [Symbol.iterator](): Iterator<TilePos> {
    return this.values();
  }

  *values(): Iterator<TilePos> {
    for (let x = this.x; x < this.x + this.width; x++) {
      for (let y = this.y; y < this.y + this.height; y++) {
        const cell : TilePos = [x, y];
        yield cell;
      }
    }
  }
};
