import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { TilePos, WorldMap } from "./WorldMap";

/** Keeps certain tiles loaded */
export class WorldAnchor extends BaseEntity implements Entity {
  constructor(
    public getCenter: () => V2d,
    public width: number = 1,
    public height: number = 1
  ) {
    super();
  }

  /** Returns a list of tiles that should stay loaded right now */
  getTilesToLoad(map: WorldMap): TilePos[] {
    const tiles: TilePos[] = [];
    const [x, y] = map.worldToTile(this.getCenter());
    for (let i = -this.width; i <= this.width; i++) {
      for (let j = -this.height; j <= this.height; j++) {
        tiles.push([x + i, y + j]);
      }
    }
    return tiles;
  }
}

export function isWorldAnchor(entity: Entity): entity is WorldAnchor {
  return entity instanceof WorldAnchor;
}
