import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { TilePos } from "../../../core/util/TilePos";
import { loadTileEventType } from "../WorldMap";

export class OnLoader extends BaseEntity implements Entity {
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
