import { makeNoise2D } from "fast-simplex-noise";
import Grid from "../../core/util/Grid";
import { degToRad, lerp } from "../../core/util/MathUtil";
import {
  rBool,
  rInteger,
  rNormal,
  rSign,
  rUniform,
} from "../../core/util/Random";
import { V } from "../../core/Vector";
import { WORLD_SIZE_TILES } from "../constants";
import { makeTurbulence1D, makeTurbulence2D } from "./signal/noise";

const JAGGEDNESS = 0.01;

const MIN_X = Math.floor(-WORLD_SIZE_TILES[0] / 2);
const MAX_X = Math.floor(WORLD_SIZE_TILES[0] / 2);
const MAX_Y = 1000;

// Terrain heights should be between these values
const MIN_TERRAIN_Y = 5;
const MAX_TERRAIN_Y = 40;

// If rock strength is below this, rock will be automatically a cave
const ROCK_STRENGTH_CAVE_THRESHOLD = -0.5;

const heightTurbulence = makeTurbulence1D({
  octaves: 8,
  amplitude: 1,
  wavelength: 50,
  peristence: 0.5,
  lacunarity: 0.5
});

const caveTurbulence = makeTurbulence2D({
  octaves: 8,
  amplitude: 1,
  wavelength: 30,
  peristence: 0.5,
  lacunarity: 0.5
});

export function generateSolidMap(): Grid<boolean> { 
  console.time("worldGen");
  const solidMap: Grid<boolean> = new Grid();

  generateSurface(solidMap);
  generateCaves(solidMap);

  console.timeEnd("worldGen");

  return solidMap;
}

function generateSurface(solidMap: Grid<boolean>): void {
  const heightMap : number[] = [];
  let minGenHeight = 0;
  let maxGenHeight = 0;
  for (let x = MIN_X; x < MAX_X; x++) {
    heightMap[x] = heightTurbulence(x);
    if (heightMap[x] < minGenHeight) {
      minGenHeight = heightMap[x];
    }
    if (heightMap[x] > maxGenHeight) { 
      maxGenHeight = heightMap[x];
    }
  }

  for (let x = MIN_X; x < MAX_X; x++) {
    const minY = Math.floor((heightMap[x] - minGenHeight) * ((MAX_TERRAIN_Y - MIN_TERRAIN_Y) / (maxGenHeight - minGenHeight)) + MIN_TERRAIN_Y);
    for (let y = minY; y < MAX_Y; y++) {
      solidMap.set([x, y], true);
    }
  }
}

function generateCaves(solidMap: Grid<boolean>):void {
  const strengthGrid: Grid<number> = new Grid();

  for (let x = MIN_X; x < MAX_X; x++) {
    for (let y = MIN_TERRAIN_Y; y < MAX_Y; y++) {
      const t = caveTurbulence(x, y);
      strengthGrid.set([x, y], t);
      if (t < ROCK_STRENGTH_CAVE_THRESHOLD) {
        solidMap.set([x, y], false);
      }
    }
  }

  doTunnel(solidMap);
  doTunnel(solidMap);
  doTunnel(solidMap);
}

function doTunnel(
  solidMap: Grid<boolean>,
  x = rInteger(MIN_X, MAX_X),
  y = 5,
  r = rUniform(1.5, 4),
  direction = rUniform(0, Math.PI),
  branchChance = r / 10
) {
  while (r > 1 && y > 0 && y < MAX_Y && x > MIN_X && x < MAX_X) {
    removeCircle(solidMap, Math.round(x), Math.round(y), Math.round(r));
    x += r * Math.cos(direction);
    y += r * Math.sin(direction);
    direction += rNormal(0, degToRad(30));
    r += rNormal(0, 1);

    if (rBool(branchChance)) {
      doTunnel(
        solidMap,
        x,
        y,
        r / 2,
        direction + rSign() * Math.PI,
        branchChance * 0.5
      );
      branchChance *= 0.9;
    }
  }

  // TODO: Branching
}

function removeCircle(
  solidMap: Grid<boolean>,
  cx: number,
  cy: number,
  r: number
): void {
  const rCeil = Math.ceil(r);
  for (let i = cx - rCeil; i < cx + rCeil; i++) {
    for (let j = cy - rCeil; j < cy + rCeil; j++) {
      if (V(cx, cy).isub([i, j]).magnitude < r) {
        solidMap.set([i, j], false);
      }
    }
  }
}
