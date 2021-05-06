import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import Grid from "../../core/util/Grid";
import GridSet from "../../core/util/GridSet";
import { rInteger } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { TILE_SIZE_METERS, WORLD_SIZE_TILES } from "../constants";
import { getDefaultTileset, getTileType } from "../utils/Tileset";
import BiomeMap from "./BiomeMap";
import GroundMap from "./GroundMap";
import { GroundTile } from "./GroundTile";
import { Minimap } from "./Minimap";
import { isWorldAnchor } from "./WorldAnchor";

export type TilePos = [number, number];
export type ChunkPos = [number, number];

export const CHUNK_SIZE = 4; // number of tiles

/** Keeps track of all the tiles and stuff */
export class WorldMap extends BaseEntity implements Entity {
  id = "worldMap";
  sprite!: CompositeTilemap & GameSprite;

  tilesLoaded = new GridSet();
  tileEntities: Grid<Entity[]> = new Grid();
  groundMap: GroundMap;
  biomeMap: BiomeMap;

  constructor(
    public minX = -WORLD_SIZE_TILES[0] / 2,
    public maxX = WORLD_SIZE_TILES[0] / 2,
    public maxY = WORLD_SIZE_TILES[1],
    public seed = rInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
  ) {
    super();

    this.sprite = new CompositeTilemap();
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.scale.set(TILE_SIZE_METERS / 64);
    this.biomeMap = new BiomeMap(minX, maxX, maxY);
    this.groundMap = new GroundMap(this.seed, this.minX, this.maxX, this.maxY);
  }

  onAdd(game: Game) {
    // Make sure we can find the WorldAnchors quickly
    game.entities.addFilter(isWorldAnchor);

    this.addChild(new Minimap(this));
  }

  tileIsSolid(tilePos: TilePos): boolean {
    return this.groundMap.tileIsSolid(tilePos);
  }

  /** Calculates which  */
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

  loadTile(tilePos: TilePos): void {
    if (!this.tilesLoaded.has(tilePos)) {
      this.tilesLoaded.add(tilePos);

      const isSolid = this.tileIsSolid(tilePos);

      if (isSolid) {
        const worldPos = this.tileToWorld(tilePos);
        const tileset = getDefaultTileset();
        const tileType = this.getTileType(tilePos);
        const groundTile = new GroundTile(worldPos);
        this.addChild(groundTile);
        this.tileEntities.set(tilePos, [groundTile]);

        const tx = tilePos[0] * 64;
        const ty = tilePos[1] * 64;
        this.sprite.tile(tileset.getTexture(tileType), tx, ty);
      }
    }
  }

  unloadTile(tilePos: TilePos): void {
    // this.tileEntities.set;
    this.tilesLoaded.delete(tilePos);

    for (const entity of this.tileEntities.get(tilePos) ?? []) {
      entity.destroy();
    }

    this.tileEntities.delete(tilePos);
  }

  /** Get the tile that a world position is in */
  worldToTile(worldPos: V2d): TilePos {
    const tilePos = worldPos.mul(1 / TILE_SIZE_METERS);
    tilePos[0] = Math.floor(tilePos[0]);
    tilePos[1] = Math.floor(tilePos[1]);
    return tilePos;
  }

  /** Get the center of a world tile */
  tileToWorld(tilePos: TilePos): V2d {
    return V(tilePos).iadd([0.5, 0.5]).imul(TILE_SIZE_METERS);
  }

  worldToChunk(worldPos: V2d): ChunkPos {
    // TODO: Implement me
    return [0, 0];
  }

  tileToChunk(tilePos: TilePos): ChunkPos {
    // TODO: Implement me
    return [0, 0];
  }

  chunkToTiles(chunkPos: ChunkPos): TilePos[] {
    // TODO: Implement me
    return [];
  }

  getAnchoredTiles(): TilePos[] {
    const tilesToLoad: TilePos[] = [];
    const anchors = this.game!.entities.getByFilter(isWorldAnchor);
    for (const anchor of anchors) {
      tilesToLoad.push(...anchor.getTilesToLoad(this));
    }
    return tilesToLoad;
  }

  onSlowTick() {
    // TODO: This is way too slow
    // get tilesToLoad
    const tilesToLoad = this.getAnchoredTiles();

    // put tiles loaded into set tilesToUnload
    const tilesToUnload = new GridSet();
    for (const tile of this.tilesLoaded) {
      tilesToUnload.add(tile);
    }

    // for each tile of tilesToLoad
    for (const tile of tilesToLoad) {
      //   remove tile from tilesToUnload
      tilesToUnload.delete(tile);
      //   if tile isn't loaded: load it
      if (!this.tilesLoaded.has(tile)) {
        this.loadTile(tile);
      }
    }

    // for each tile of tilesToUnload
    for (const tile of tilesToUnload) {
      this.unloadTile(V(tile));
    }
  }
}

export function getWorldMap(game?: Game): WorldMap | undefined {
  return game?.entities.getById("worldMap") as WorldMap;
}
