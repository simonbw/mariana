import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { rBool, rInteger } from "../../core/util/Random";
import { TilePos } from "../../core/util/TilePos";
import { V, V2d } from "../../core/Vector";
import { TILE_SIZE_METERS, WORLD_SIZE_TILES } from "../constants";
import { Minimap } from "../hud/Minimap";
import BiomeMap from "./generation/BiomeMap";
import GroundMap from "./generation/GroundMap";
import StuffMap from "./generation/StuffMap";
import { GroundLoader } from "./loading/GroundLoader";
import { StuffLoader } from "./loading/StuffLoader";
import SubGridSet from "./loading/SubGridSet";
import { isWorldAnchor } from "./loading/WorldAnchor";

/** Keeps track of all the tiles and stuff */
export class WorldMap extends BaseEntity implements Entity {
  id = "worldMap";

  groundMap: GroundMap;
  biomeMap: BiomeMap;
  stuffMap: StuffMap;

  tilesLoaded: SubGridSet = new SubGridSet();
  groundLoader: GroundLoader;
  stuffLoader: StuffLoader;

  constructor(
    public minX = -WORLD_SIZE_TILES[0] / 2,
    public maxX = WORLD_SIZE_TILES[0] / 2,
    public maxY = WORLD_SIZE_TILES[1],
    public seed = rInteger(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
  ) {
    super();
    // Generators
    this.biomeMap = new BiomeMap(minX, maxX, maxY);
    this.groundMap = new GroundMap(this.seed, this.minX, this.maxX, this.maxY);
    this.stuffMap = new StuffMap(this);

    // Loaders
    this.groundLoader = this.addChild(new GroundLoader(this));
    this.stuffLoader = this.addChild(new StuffLoader(this));

    this.addChild(new Minimap(this));
  }

  onAdd(game: Game) {
    // Make sure we can find the WorldAnchors quickly
    game.entities.addFilter(isWorldAnchor);
  }

  loadTile(tilePos: TilePos): void {
    this.game!.dispatch({ type: "tileLoaded", tilePos });
    this.game!.dispatch({ type: loadTileEventType(tilePos) });
  }

  unloadTile(tilePos: TilePos): void {
    this.game!.dispatch({ type: "tileUnloaded", tilePos });
    this.game!.dispatch({ type: unloadTileEventType(tilePos) });
  }

  tileIsLoaded(tilePos: TilePos): boolean {
    return this.tilesLoaded.has(tilePos);
  }

  worldPointIsLoaded(worldPos: [number, number]): boolean {
    return this.tileIsLoaded(this.worldToTile(worldPos));
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

export function loadTileEventType(tilePos: TilePos) {
  return `tileLoaded ${tilePos[0]},${tilePos[1]}`;
}

export function unloadTileEventType(tilePos: TilePos) {
  return `tileUnloaded ${tilePos[0]},${tilePos[1]}`;
}
