import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Grid from "../../../core/util/Grid";
import { Layer } from "../../config/layers";
import { TILE_SIZE_METERS } from "../../constants";
import { GroundTile } from "../../plants/GroundTile";
import { getDefaultTileset } from "../../utils/Tileset";
import { TilePos } from "../TilePos";
import { WorldMap } from "../WorldMap";

export class GroundLoader extends BaseEntity implements Entity {
  groundTiles: Grid<GroundTile> = new Grid();
  sprite!: CompositeTilemap & GameSprite;

  constructor(public worldMap: WorldMap) {
    super();

    this.sprite = new CompositeTilemap();
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.scale.set(TILE_SIZE_METERS / 64);
  }

  loadTile(tilePos: TilePos): void {
    const isSolid = this.worldMap.groundMap.tileIsSolid(tilePos);

    if (isSolid) {
      const worldPos = this.worldMap.tileToWorld(tilePos);
      const tileset = getDefaultTileset();
      const tileType = this.worldMap.groundMap.getTileType(tilePos);
      const groundTile = new GroundTile(worldPos);
      this.addChild(groundTile);
      this.groundTiles.set(tilePos, groundTile);

      const tx = tilePos[0] * 64;
      const ty = tilePos[1] * 64;
      this.sprite.tile(tileset.getTexture(tileType), tx, ty);
    }
  }

  unloadTile(tilePos: TilePos): void {
    this.groundTiles.get(tilePos)?.destroy();
    this.groundTiles.delete(tilePos);
  }

  handlers = {
    tileLoaded: ({ tilePos }: { tilePos: TilePos }) => {
      this.loadTile(tilePos);
    },
    tileUnloaded: ({ tilePos }: { tilePos: TilePos }) => {
      this.unloadTile(tilePos);
    },
  };
}
