import Grid from "../../../core/util/Grid";
import { lerp, polarToVec } from "../../../core/util/MathUtil";
import { rUniform } from "../../../core/util/Random";
import { TilePos } from "../../../core/util/TilePos";
import { V, V2d } from "../../../core/Vector";
import {
  TILE_SIZE_METERS,
  WORLD_LEFT_EDGE,
  WORLD_RIGHT_EDGE,
  WORLD_SIZE_METERS,
} from "../../constants";
import { getTileType } from "../../utils/Tileset";
import { makeTurbulence1D, makeTurbulence2D } from "./noise";

// Terrain heights should be between these values
const MIN_SURFACE_Y_TILE_COORDS = 5;
const MAX_SURFACE_Y_TILE_COORDS = 40;

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
    console.time("ground generation");
    this.generateSurface();
    this.generateCaves();
    this.generateTunnels();

    console.timeEnd("ground generation");
  }

  public tileIsSolid(tilePos: TilePos): boolean {
    const [x, y] = tilePos;
    if (x < this.minX) {
      return true;
    } else if (x >= this.maxX) {
      return true;
    } else if (y >= this.maxY) {
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

  // TODO: Don't allocate so much
  /** Calculates which type of tile a tile is */
  getTileType(tilePos: TilePos): number {
    const middle = V(tilePos);
    return getTileType({
      middle: this.tileIsSolid(middle),
      left: this.tileIsSolid(middle.add([-1, 0])),
      top: this.tileIsSolid(middle.add([0, -1])),
      right: this.tileIsSolid(middle.add([1, 0])),
      bottom: this.tileIsSolid(middle.add([0, 1])),
      topLeft: this.tileIsSolid(middle.add([-1, -1])),
      topRight: this.tileIsSolid(middle.add([1, -1])),
      bottomLeft: this.tileIsSolid(middle.add([-1, 1])),
      bottomRight: this.tileIsSolid(middle.add([1, 1])),
    });
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
        lerp(
          MIN_SURFACE_Y_TILE_COORDS,
          MAX_SURFACE_Y_TILE_COORDS,
          heightPercent
        )
      );
      for (let y = minY; y < this.maxY; y++) {
        this.solidMap.set([x, y], true);
      }
    }
  }

  private generateCaves(): void {
    const strengthGrid: Grid<number> = new Grid();

    for (let x = this.minX; x < this.maxX; x++) {
      for (let y = MIN_SURFACE_Y_TILE_COORDS; y < this.maxY; y++) {
        const turbulence = this.caveTurbulence(x, y);
        const layeredTurbulence = turbulence * Math.sin(y / 30);
        const tilesFromEdge = Math.min(
          x - this.minX,
          this.maxX - x,
          y / 10, // We want caves to appear 10x further from the top than the sides/bottom
          this.maxY - y
        );
        const transitionWidthTiles = 10;
        const strength =
          tilesFromEdge < transitionWidthTiles
            ? lerp(1, layeredTurbulence, tilesFromEdge / transitionWidthTiles)
            : layeredTurbulence;
        strengthGrid.set([x, y], strength);

        if (strength < -0.2) {
          this.solidMap.set([x, y], false);
        }
      }
    }
  }

  private generateTunnels() {
    type RecursionState = {
      position: V2d; // Start of tunnel.
      direction: number; // Radians.
      length: number; // Length of tunnel segment in meters.
      width: number; // Width of tunnel in meters.  Will get smaller as we fork.,
      recursionDepth: number;
    };

    // Start with threes line going from surface to bottom of the world.
    // We will then recursively subdivide, jitter, and fork those lines
    const stateStack: RecursionState[] = [
      {
        position: V(0, 0),
        direction: Math.PI / 2,
        length: WORLD_SIZE_METERS[1],
        width: 8,
        recursionDepth: 0,
      },
      {
        position: V((WORLD_LEFT_EDGE * 3) / 4, 0),
        direction: (3 * Math.PI) / 8,
        length: WORLD_SIZE_METERS[1],
        width: 8,
        recursionDepth: 0,
      },
      {
        position: V((WORLD_RIGHT_EDGE * 3) / 4, 0),
        direction: (5 * Math.PI) / 8,
        length: WORLD_SIZE_METERS[1],
        width: 8,
        recursionDepth: 0,
      },
    ];

    let s;
    while ((s = stateStack.pop())) {
      if (s.length < 5 || s.recursionDepth > 10) {
        for (let i = 0; i < s.length; i++) {
          let p = s.position.add(polarToVec(s.direction, i));
          this.removeCircle(p, s.width / 2);
        }

        continue;
      }

      const segmentEndPoint = s.position.add(polarToVec(s.direction, s.length));

      // Subdivide
      const subdivisionPercentage = rUniform(1 / 2, 2 / 3);

      // Jitter
      const jitterAngleOffset = rUniform(-Math.PI / 8, Math.PI / 8);
      const trunkLength =
        (s.length * subdivisionPercentage) / Math.cos(jitterAngleOffset);
      const trunkDirection = s.direction + jitterAngleOffset;

      // Fork
      const forkPoint = s.position.add(polarToVec(trunkDirection, trunkLength));
      const mainForkV = segmentEndPoint.sub(forkPoint);
      const forkLength = mainForkV.magnitude;
      const mainForkAngle = mainForkV.angle;
      const mainForkAngleOffset = mainForkAngle - trunkDirection;
      const tributaryForkAngleOffset =
        Math.sign(-mainForkAngleOffset) * rUniform(0, Math.PI / 4);

      // Trunk
      stateStack.push({
        position: s.position,
        direction: trunkDirection,
        length: trunkLength,
        width: s.width,
        recursionDepth: s.recursionDepth + 1,
      });
      // Main fork
      stateStack.push({
        position: forkPoint,
        direction: mainForkAngle,
        length: forkLength,
        width: s.width * 0.95,
        recursionDepth: s.recursionDepth + 1,
      });
      // Tributary fork
      if (s.width > 5) {
        stateStack.push({
          position: forkPoint,
          direction: trunkDirection + tributaryForkAngleOffset,
          length: forkLength,
          width: s.width * 0.6,
          recursionDepth: s.recursionDepth + 1,
        });
      }
    }
  }

  private removeCircle(p: V2d, r: number): void {
    const cx = Math.round(p.x / TILE_SIZE_METERS);
    const cy = Math.round(p.y / TILE_SIZE_METERS);
    const rCeil = Math.ceil(r / TILE_SIZE_METERS);
    for (let i = cx - rCeil; i < cx + rCeil; i++) {
      for (let j = cy - rCeil; j < cy + rCeil; j++) {
        if (
          V(cx, cy).isub([i, j]).magnitude < r &&
          i > this.minX + 5 &&
          i < this.maxX - 5 &&
          j < this.maxY - 5
        ) {
          this.solidMap.set([i, j], false);
        }
      }
    }
  }
}
