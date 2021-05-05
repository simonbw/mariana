import { V } from "../core/Vector";

export const TILE_SIZE_METERS = 2.25; // size of a tile in meters x meters
export const WORLD_SIZE_TILES = V(256, 512);
export const LAYER_HEIGHT_TILES = 32;
// size of the world in meters x meters
export const WORLD_SIZE_METERS = WORLD_SIZE_TILES.mul(TILE_SIZE_METERS);

export const REGIONS_START_DEPTH = 5; // depth in meters of the first region
export const WORLD_LEFT_EDGE = -0.5 * WORLD_SIZE_METERS[0];
export const WORLD_RIGHT_EDGE = 0.5 * WORLD_SIZE_METERS[0];
export const WORLD_BOTTOM = WORLD_SIZE_METERS[1] + REGIONS_START_DEPTH;
