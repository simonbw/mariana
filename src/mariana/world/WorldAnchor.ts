import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { TILE_SIZE_METERS } from "../constants";
import { SubGrid } from "./SubGrid";
import { WorldMap } from "./WorldMap";

/** Keeps certain tiles loaded */
export class WorldAnchor extends BaseEntity implements Entity {
  constructor(
    public getCenter: () => V2d,
    /** Sizee in meters */
    public widthMeters: number = 1,
    /** Sizee in meters */
    public heightMeters: number = 1
  ) {
    super();
  }

  /** Returns a list of tiles that should stay loaded right now */
  getTilesToLoad(map: WorldMap): SubGrid {
    const [x, y] = map.worldToTile(this.getCenter());
    const [minX, minY] = map.worldToTile(V(x - this.widthMeters, y - this.heightMeters));
    return new SubGrid(minX, minY, this.widthMeters * TILE_SIZE_METERS, this.heightMeters * TILE_SIZE_METERS);
  }
}

export function isWorldAnchor(entity: Entity): entity is WorldAnchor {
  return entity instanceof WorldAnchor;
}
