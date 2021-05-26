import { Graphics } from "@pixi/graphics";
import { Sprite } from "@pixi/sprite";
import { CompositeTilemap } from "@pixi/tilemap";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { KeyCode } from "../../core/io/Keys";
import { Layer } from "../config/layers";
import { makeBox } from "../utils/gridUtils";
import { getStoneTileset1 } from "../world/tilesets";
import { getWorldMap } from "../world/WorldMap";

/** Really bad, just for testing world generation */
export class Minimap extends BaseEntity implements Entity {
  sprite!: Sprite & GameSprite;

  constructor() {
    super();
  }

  onAdd(game: Game) {
    const tilemap = new CompositeTilemap();
    const worldMap = getWorldMap(game)!;
    const { minX, maxX, maxY } = worldMap;
    for (const [x, y] of makeBox(minX - 5, 0, maxX + 5, maxY)) {
      if (worldMap.groundMap.tileIsSolid([x, y])) {
        const biome = worldMap.biomeMap.getBiome([x, y]);
        const tileset = biome.tileset;
        tilemap.tile(tileset.getTexture(7), x * 64, y * 64);
      }
    }

    const background = new Graphics();
    background.beginFill(0x66aaff, 0.5);
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
    if (key === "Semicolon") {
      this.sprite.visible = !this.sprite.visible;
    }
  }
}
