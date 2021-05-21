import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { TilePos } from "../TilePos";
import {
  getWorldMap,
  loadTileEventType,
  unloadTileEventType,
} from "../WorldMap";

/** Keeps track of multiple tiles */
export class MultiTileLoader extends BaseEntity implements Entity {
  private loadedCount: number = 0;

  constructor(
    /** All the positions to be looking at */
    private tilePositions: TilePos[],
    /** Function to call when first tile is loaded. */
    private onSomeLoaded: () => void,
    /** Function to call when no tiles remain loaded. */
    private onAllUnloaded: () => void
  ) {
    super();

    this.handlers = {};

    for (const tilePos of tilePositions) {
      this.handlers[loadTileEventType(tilePos)] = () => this.onTileLoaded();
      this.handlers[unloadTileEventType(tilePos)] = () => this.onTileUnloaded();
      console.log;
    }
  }

  onAdd(game: Game) {
    for (const tilePos of this.tilePositions) {
      const worldMap = getWorldMap(game)!;
      if (worldMap.tileIsLoaded(tilePos)) {
        this.loadedCount += 1;
      }
    }

    if (this.loadedCount > 0) {
      this.onSomeLoaded();
    }
  }

  onTileLoaded() {
    this.loadedCount += 1;

    if (this.loadedCount === 1) {
      this.onSomeLoaded();
    }
  }

  onTileUnloaded() {
    this.loadedCount -= 1;

    if (this.loadedCount === 0) {
      this.onAllUnloaded();
    }
  }
}
