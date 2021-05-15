import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { TilePos } from "../../../core/util/TilePos";
import { V2d } from "../../../core/Vector";
import {
  getWorldMap,
  loadTileEventType,
  unloadTileEventType,
} from "../WorldMap";

export class TileLoadListener extends BaseEntity implements Entity {
  constructor(tilePos: TilePos, onLoad: (game: Game) => void) {
    super();

    this.handlers = {
      [loadTileEventType(tilePos)]: () => {
        onLoad(this.game!);
        this.destroy();
      },
    };
  }
}

export class WorldLoadListener extends BaseEntity implements Entity {
  constructor(private worldPos: V2d, private onLoad: (game: Game) => void) {
    super();
  }

  onAdd(game: Game) {
    const tilePos = getWorldMap(game)!.worldToTile(this.worldPos);
    this.handlers = {
      [loadTileEventType(tilePos)]: () => {
        this.onLoad(game);
        this.destroy();
      },
    };
  }
}

export class TileUnloadListener extends BaseEntity implements Entity {
  constructor(tilePos: TilePos, onUnload: (game: Game) => void) {
    super();

    this.handlers = {
      [unloadTileEventType(tilePos)]: () => {
        onUnload(this.game!);
        this.destroy();
      },
    };
  }
}

export class WorldUnloadListener extends BaseEntity implements Entity {
  constructor(private worldPos: V2d, private onUnload: (game: Game) => void) {
    super();
  }

  onAdd(game: Game) {
    const tilePos = getWorldMap(game)!.worldToTile(this.worldPos);
    this.handlers = {
      [unloadTileEventType(tilePos)]: () => {
        this.onUnload(game);
        this.destroy();
      },
    };
  }
}
