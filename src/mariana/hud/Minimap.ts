import { Graphics } from "@pixi/graphics";
import { Sprite } from "@pixi/sprite";
import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { KeyCode } from "../../core/io/Keys";
import { Layer } from "../config/layers";
import { getDefaultTileset } from "../utils/Tileset";
import { WorldMap } from "../world/WorldMap";

/** Really bad, just for testing world generation */
export class Minimap extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(worldMap: WorldMap) {
    super();

    const tilemap = new CompositeTilemap();

    const tileset = getDefaultTileset();

    const { minX, maxX, maxY } = worldMap;
    for (let x = minX - 5; x < maxX + 5; x++) {
      for (let y = 0; y < maxY; y++) {
        if (worldMap.groundMap.tileIsSolid([x, y])) {
          tilemap.tile(tileset.getTexture(7), x * 64, y * 64);
        }
      }
    }

    const background = new Graphics();
    background.beginFill(0x0077ff, 0.3);
    background.drawRect(minX * 64, 0, (maxX - minX) * 64, maxY * 64);
    background.endFill();

    this.sprite = new Sprite();
    this.sprite.addChild(background);
    this.sprite.addChild(tilemap);
    this.sprite.scale.set(1.8 / 64);

    this.sprite.visible = false;
    this.sprite.layerName = Layer.HUD;
  }

  onResize([w, h]: [number, number]) {
    this.sprite.x = w / 2;
    this.sprite.y = 20;
  }

  onKeyDown(key: KeyCode) {
    if (key === "KeyL") {
      this.sprite.visible = !this.sprite.visible;
    }
  }
}
