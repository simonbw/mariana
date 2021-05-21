import { vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_phone from "../../../resources/images/environment/phone.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { getDiver } from "../diver/Diver";

const PICKUP_DISTANCE = 4;

export class Phone extends BaseEntity implements Entity {
  sprite: Sprite;

  constructor(public position: V2d) {
    super();

    console.log(`phone spawned at ${position}`);

    this.sprite = Sprite.from(img_phone);
    this.sprite.height = this.sprite.width = 0.3;
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(...position);
  }

  onTick() {
    const diver = getDiver(this.game);

    if (
      diver &&
      !diver.isDead &&
      vec2.dist(diver.getPosition(), this.position) < PICKUP_DISTANCE
    ) {
      this.game?.dispatch({ type: "victory" });
      this.destroy();
    }
  }
}
