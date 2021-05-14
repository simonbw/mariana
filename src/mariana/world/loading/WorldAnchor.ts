import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V, V2d } from "../../../core/Vector";
import { SubGrid } from "./SubGrid";
import { WorldMap } from "../WorldMap";

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
    const positionWorld = this.getCenter();
    const halfDimensionMeters = V(this.widthMeters / 2, this.heightMeters / 2);
    const upperLeftCornerTile = V(
      map.worldToTile(positionWorld.sub(halfDimensionMeters))
    );
    const lowerRightCornerTile = V(
      map.worldToTile(positionWorld.add(halfDimensionMeters))
    );
    const dimensionsTile = lowerRightCornerTile.sub(upperLeftCornerTile);
    return new SubGrid(
      upperLeftCornerTile.x,
      upperLeftCornerTile.y,
      dimensionsTile.x,
      dimensionsTile.y
    );
  }
}

export function isWorldAnchor(entity: Entity): entity is WorldAnchor {
  return entity instanceof WorldAnchor;
}
