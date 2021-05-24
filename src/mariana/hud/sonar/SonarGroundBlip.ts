import { Sprite } from "pixi.js";
import img_sonarTile from "../../../../resources/images/ui/sonar-tile.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { TILE_SIZE_METERS } from "../../constants";

export class SonarGroundBlip extends BaseEntity implements Entity {
  sonarSprite: Sprite;

  constructor(position: [number, number]) {
    super();

    this.sonarSprite = Sprite.from(img_sonarTile);
    this.sonarSprite.anchor.set(0.5);
    this.sonarSprite.position.set(...position);

    this.sonarSprite.scale.set(TILE_SIZE_METERS / 4.0);
  }

  onRender(dt: number) {
    this.sonarSprite.alpha -= dt * 0.5;
    if (this.sonarSprite.alpha <= 0) {
      this.destroy();
    }
  }

  onDestroy() {
    this.sonarSprite.parent?.removeChild(this.sonarSprite);
  }
}
