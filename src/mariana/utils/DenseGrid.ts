import { clamp } from "../../core/util/MathUtil";

/** A fast grid for boolean values */
export class DenseGrid<T> {
  data: T[];
  width: number;
  height: number;
  size: number;

  constructor(
    public minX: number,
    public minY: number,
    public maxX: number,
    public maxY: number,
    public fallback: T,
    fill: T = fallback
  ) {
    this.width = maxX - minX;
    this.height = maxY - minY;
    this.size = this.width * this.height;

    this.data = [];
    for (let i = 0; i < this.size; i++) {
      this.data.push(fill);
    }
  }

  private inBounds(x: number, y: number): boolean {
    return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
  }

  private getIndex(x: number, y: number): number {
    const gx = x - this.minX;
    const gy = y - this.minY;
    return gy * this.width + gx;
  }

  get(x: number, y: number): T {
    if (!this.inBounds(x, y)) {
      return this.fallback;
    }
    const index = this.getIndex(x, y);
    return this.data[index];
  }

  set(x: number, y: number, value: T) {
    if (this.inBounds(x, y)) {
      const index = this.getIndex(x, y);
      this.data[index] = value;
    }
  }
}
