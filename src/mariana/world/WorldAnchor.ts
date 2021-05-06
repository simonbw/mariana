import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SubGrid } from "../../core/util/SubGrid";
import { V, V2d } from "../../core/Vector";
import { WorldMap } from "./WorldMap";

/** Keeps certain tiles loaded */
export class WorldAnchor extends BaseEntity implements Entity {
  constructor(
    public getCenter: () => V2d,
    /** Sizee in meters */
    public width: number = 1,
    /** Sizee in meters */
    public height: number = 1
  ) {
    super();
  }

  /** Returns a list of tiles that should stay loaded right now */
  getTilesToLoad(map: WorldMap): SubGrid {
    const [x, y] = map.worldToTile(this.getCenter());
    const [minX, minY] = map.worldToTile(V(x - this.width, y - this.height));
    return new SubGrid(minX, minY, this.width, this.height);
  }
}

export function isWorldAnchor(entity: Entity): entity is WorldAnchor {
  return entity instanceof WorldAnchor;
}
