import Grid from "../../core/util/Grid";
import { degToRad, lerp, stepToward } from "../../core/util/MathUtil";
import {
  rBool,
  rInteger,
  rNormal,
  rSign,
  rUniform,
} from "../../core/util/Random";
import { V } from "../../core/Vector";
import { makeTurbulence1D, makeTurbulence2D } from "./signal/noise";
import { TilePos } from "./WorldMap";

// Terrain heights should be between these values
const MIN_SURFACE_Y = 5;
const MAX_SURFACE_Y = 40;

export default class GroundMap {
  private solidMap: Grid<boolean> = new Grid();

  surface = makeTurbulence1D({
    octaves: 3,
    amplitude: 1,
    wavelength: 70,
    peristence: 0.5,
    lacunarity: 0.5,
  });

  caveTurbulence = makeTurbulence2D({
    octaves: 4,
    amplitude: 1,
    wavelength: 30,
    peristence: 0.5,
    lacunarity: 0.5,
  });

  constructor(
    public seed: number,
    public minX: number,
    public maxX: number,
    public maxY: number
  ) {
    console.time("worldGen");
    this.generateSurface();
    this.generateCaves();
    this.generateTunnels();

    console.timeEnd("worldGen");
  }

  public tileIsSolid(tilePos: TilePos): boolean {
    const [x, y] = tilePos;
    if (x < this.minX) {
      return true;
    } else if (x > this.maxX) {
      return true;
    } else if (y > this.maxY) {
      return true;
    }
    return this.solidMap.get(tilePos) ?? false;
  }

  getHighestTile(x: number): number {
    let y = -1;
    while (!this.tileIsSolid([x, y])) {
      y++;
    }
    return y;
  }

  private generateSurface(): void {
    const heightMap: number[] = [];
    let minGenHeight = 0;
    let maxGenHeight = 0;
    for (let x = this.minX; x < this.maxX; x++) {
      heightMap[x] = this.surface(x);
      if (heightMap[x] < minGenHeight) {
        minGenHeight = heightMap[x];
      }
      if (heightMap[x] > maxGenHeight) {
        maxGenHeight = heightMap[x];
      }
    }

    for (let x = this.minX; x < this.maxX; x++) {
      const heightPercent =
        (heightMap[x] - minGenHeight) / (maxGenHeight - minGenHeight);
      const minY = Math.floor(
        lerp(MIN_SURFACE_Y, MAX_SURFACE_Y, heightPercent)
      );
      for (let y = minY; y < this.maxY; y++) {
        this.solidMap.set([x, y], true);
      }
    }
  }

  private generateCaves(): void {
    const strengthGrid: Grid<number> = new Grid();

    for (let x = this.minX; x < this.maxX; x++) {
      for (let y = MIN_SURFACE_Y; y < this.maxY; y++) {
        const t = this.caveTurbulence(x, y);
        strengthGrid.set([x, y], t);
        if (t < this.getCaveThreshold(x, y)) {
          this.solidMap.set([x, y], false);
        }
      }
    }
  }

  private getCaveThreshold(x: number, y: number): number {
    if (y < 50) {
      return -1;
    } else {
      const t = (2 * Math.PI * (y - 50)) / 120;
      return Math.sin(t) - 0.4;
    }
  }

  private generateTunnels() {
    // one tunnel on the left
    const x1 = rInteger(this.minX * 0.9, this.minX * 0.05);
    const y1 = this.getHighestTile(x1);
    const d1 = rNormal(degToRad(90), degToRad(30));
    const r1 = 6;
    this.generateTunnel(x1, y1, r1, d1);

    // one tunnel on the right
    const x2 = rInteger(this.maxX * 0.9, this.maxX * 0.05);
    const y2 = this.getHighestTile(x2);
    const d2 = rNormal(degToRad(90), degToRad(30));
    const r2 = 4;
    this.generateTunnel(x2, y2, r2, d2);
  }

  private generateTunnel(
    x = rInteger(this.minX, this.maxX),
    y = 5,
    r = rUniform(1.5, 4),
    direction = rUniform(0, Math.PI),
    branchChance = r * 0.001
  ) {
    while (r > 1 && y > 0 && y < this.maxY && x > this.minX && x < this.maxX) {
      this.removeCircle(Math.round(x), Math.round(y), Math.round(r));
      x += r * Math.cos(direction);
      y += r * Math.sin(direction);
      // bias them downwards
      direction = stepToward(direction, Math.PI / 2, 0.01);
      // but do go somewhere random
      direction += rNormal(0, degToRad(30));
      r += rNormal(0, 1);

      if (rBool(branchChance)) {
        this.generateTunnel(
          x,
          y,
          r / 2,
          direction + rSign() * rUniform(degToRad(10), degToRad(50)),
          branchChance * 0.5
        );
        branchChance *= 0.8;
      }
    }
  }

  private removeCircle(cx: number, cy: number, r: number): void {
    const rCeil = Math.ceil(r);
    for (let i = cx - rCeil; i < cx + rCeil; i++) {
      for (let j = cy - rCeil; j < cy + rCeil; j++) {
        if (V(cx, cy).isub([i, j]).magnitude < r) {
          this.solidMap.set([i, j], false);
        }
      }
    }
  }
}
