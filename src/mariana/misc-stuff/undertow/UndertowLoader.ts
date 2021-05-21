import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { V2d } from "../../../core/Vector";
import { MultiTileLoader } from "../../world/loading/MultiTileLoader";
import { TilePos } from "../../world/TilePos";
import { getWorldMap } from "../../world/WorldMap";
import { Undertow } from "./Undertow";

export class UndertowLoader extends BaseEntity implements Entity {
  current: Undertow | undefined;

  constructor(private position: V2d) {
    super();
  }

  onAdd(game: Game) {
    const worldMap = getWorldMap(game)!;
    const [minX, minY] = worldMap.worldToTile(this.position.add([-2.5, -5]));
    const [maxX, maxY] = worldMap.worldToTile(this.position.add([2.5, 5]));
    const tiles: TilePos[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push([x, y]);
      }
    }
    this.addChild(
      new MultiTileLoader(
        tiles,
        () => {
          this.current = game.addEntity(new Undertow(this.position));
        },
        () => {
          this.current?.destroy();
          this.current = undefined;
        }
      )
    );
  }
}
