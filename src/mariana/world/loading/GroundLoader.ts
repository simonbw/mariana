import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layer } from "../../config/layers";
import { TILE_SIZE_METERS } from "../../constants";
import { GroundTile } from "../../plants/GroundTile";
import { DenseGrid } from "../../utils/DenseGrid";
import { TilePos } from "../TilePos";
import { WorldMap } from "../WorldMap";

export class GroundLoader extends BaseEntity implements Entity {
  groundTiles: DenseGrid<GroundTile | undefined>;
  sprite!: CompositeTilemap & GameSprite;

  constructor(public worldMap: WorldMap) {
    super();

    this.sprite = new CompositeTilemap();
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.scale.set(TILE_SIZE_METERS / 64);

    this.groundTiles = new DenseGrid(
      worldMap.minX - 1,
      -1,
      worldMap.maxX + 1,
      worldMap.maxY + 1,
      undefined
    );
  }

  renderTile(tilePos: TilePos) {
    const biomeMap = this.worldMap.biomeMap;
    const biome = biomeMap.getBiome(tilePos);
    const upBiome = biomeMap.getBiome([tilePos[0], tilePos[1] - 1]);
    const up2Biome = biomeMap.getBiome([tilePos[0], tilePos[1] - 2]);
    const downBiome = biomeMap.getBiome([tilePos[0], tilePos[1] + 1]);
    const down2Biome = biomeMap.getBiome([tilePos[0], tilePos[1] + 2]);

    const tileType = this.worldMap.groundMap.getTileType(tilePos);
    const tx = tilePos[0] * 64;
    const ty = tilePos[1] * 64;

    this.sprite.tile(biome.tileset.getTexture(tileType), tx, ty);

    if (upBiome !== biome) {
      this.sprite.tile(upBiome.tileset.getTexture(tileType), tx, ty, {
        alpha: 0.3,
      });
    }
    if (up2Biome !== biome) {
      this.sprite.tile(up2Biome.tileset.getTexture(tileType), tx, ty, {
        alpha: 0.1,
      });
    }
    if (downBiome !== biome) {
      this.sprite.tile(downBiome.tileset.getTexture(tileType), tx, ty, {
        alpha: 0.3,
      });
    }
    if (down2Biome !== biome) {
      this.sprite.tile(down2Biome.tileset.getTexture(tileType), tx, ty, {
        alpha: 0.1,
      });
    }
  }

  loadTile(tilePos: TilePos): void {
    const isSolid = this.worldMap.groundMap.tileIsSolid(tilePos);
    if (isSolid) {
      const worldPos = this.worldMap.tileToWorld(tilePos);
      const groundTile = new GroundTile(worldPos);
      this.addChild(groundTile);
      this.groundTiles.set(tilePos[0], tilePos[1], groundTile);

      this.renderTile(tilePos);
    }
  }

  unloadTile([x, y]: TilePos): void {
    this.groundTiles.get(x, y)?.destroy();
    this.groundTiles.set(x, y, undefined);
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
