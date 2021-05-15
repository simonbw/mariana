import { Graphics } from "@pixi/graphics";
import { Sprite } from "pixi.js";
import img_bubble from "../../../resources/images/particles/bubble.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";

export class FishSpawner extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(position: V2d) {
    super();

    this.sprite = Sprite.from(img_bubble);
    this.sprite.width = this.sprite.height = 0.5;
    this.sprite.position.set(...position);
  }

  onSlowTick() {
    if (rBool(0.1)) {
    }
  }
}
