import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import Grid from "../../core/util/Grid";
import { rInteger } from "../../core/util/Random";
import SubGridSet from "../../core/util/SubGridSet";
import { TilePos } from "../../core/util/TilePos";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { TILE_SIZE_METERS, WORLD_SIZE_TILES } from "../constants";
import { getDefaultTileset, getTileType } from "../utils/Tileset";
import BiomeMap from "./BiomeMap";
import GroundMap from "./GroundMap";
import { GroundTile } from "./GroundTile";
import { Minimap } from "./Minimap";
import { isWorldAnchor } from "./WorldAnchor";

/** Keeps track of all the tiles and stuff */
export class WorldMap extends BaseEntity implements Entity {
  id = "worldMap";
  sprite!: CompositeTilemap & GameSprite;

  tilesLoaded: SubGridSet = new SubGridSet();
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

  unloadTile(tilePos: TilePos): void {
    for (const entity of this.tileEntities.get(tilePos) ?? []) {
      entity.destroy();
    }

    this.tileEntities.delete(tilePos);
  }

  worldPointIsLoaded(worldPos: [number, number]): boolean {
    return this.tileIsLoaded(this.worldToTile(worldPos));
  }

  tileIsLoaded(tilePos: TilePos): boolean {
    return this.tilesLoaded.has(tilePos);
  }

  /** Get the tile that a world position is in */
  worldToTile([x, y]: [number, number]): TilePos {
    return [Math.floor(x / TILE_SIZE_METERS), Math.floor(y / TILE_SIZE_METERS)];
  }

  /** Get the center of a world tile */
  tileToWorld(tilePos: TilePos): V2d {
    return V(tilePos).iadd([0.5, 0.5]).imul(TILE_SIZE_METERS);
  }

  getAnchoredTiles(): SubGridSet {
    const tilesToLoad = new SubGridSet();
    const anchors = this.game!.entities.getByFilter(isWorldAnchor);
    for (const anchor of anchors) {
      tilesToLoad.add(anchor.getTilesToLoad(this));
    }
    return tilesToLoad;
  }

  onSlowTick() {
    const lastFramesTiles: SubGridSet = this.tilesLoaded;
    const currentFramesTiles: SubGridSet = this.getAnchoredTiles();

    for (const tile of currentFramesTiles) {
      if (!lastFramesTiles.has(tile)) {
        this.loadTile(tile as TilePos);
      }
    }

    for (const tile of lastFramesTiles) {
      if (!currentFramesTiles.has(tile)) {
        this.unloadTile(tile as TilePos);
      }
    }

    this.tilesLoaded = currentFramesTiles;
  }
}

export function getWorldMap(game?: Game): WorldMap | undefined {
  return game?.entities.getById("worldMap") as WorldMap;
}
