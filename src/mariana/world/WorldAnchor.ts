import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { ChunkPos, TilePos, WorldMap } from "./WorldMap";

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
  getTilesToLoad(map: WorldMap): TilePos[] {
    const tiles: TilePos[] = [];
    const [x, y] = map.worldToTile(this.getCenter());
    const [minX, minY] = map.worldToTile(V(x - this.width, y - this.height));
    const [maxX, maxY] = map.worldToTile(V(x + this.width, y + this.height));
    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        tiles.push([x + i, y + j]);
      }
    }
    return tiles;
  }

  /** Returns a list of tiles that should stay loaded right now */
  getChunksToLoad(map: WorldMap): ChunkPos[] {
    const chunks: ChunkPos[] = [];
    const [x, y] = map.worldToChunk(this.getCenter());
    const [minX, minY] = map.worldToChunk(V(x - this.width, y - this.height));
    const [maxX, maxY] = map.worldToChunk(V(x + this.width, y + this.height));
    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        chunks.push([x + i, y + j]);
      }
    }
    return chunks;
  }
}

export function isWorldAnchor(entity: Entity): entity is WorldAnchor {
  return entity instanceof WorldAnchor;
}
