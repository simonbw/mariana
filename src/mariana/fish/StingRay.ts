import { AnimatedSprite } from "pixi.js";
import img_stingRay1 from "../../../resources/images/fish/sting_ray_1.png";
import img_stingRay2 from "../../../resources/images/fish/sting_ray_2.png";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Diver } from "../diver/Diver";
import { GroundTile } from "../world/GroundTile";
import { BaseFish } from "./BaseFish";

const PATROL_TIME = 5.0; // seconds travelled in each direction
const WIDTH = 3;

export class StingRay extends BaseFish {
  sprite: AnimatedSprite & GameSprite;

  movingRight = rBool();

  constructor(position: V2d) {
    super({ hp: 20, dropValue: 10 });

    this.sprite = AnimatedSprite.fromImages([img_stingRay1, img_stingRay2]);

    this.sprite.animationSpeed = 1;
    this.sprite.autoUpdate = false;
    this.sprite.scale.set(WIDTH / this.sprite.texture.width);
    this.sprite.anchor.set(0.5);
    this.sprite.loop = true;
    this.sprite.position.set(...position);

    if (this.movingRight) {
      this.sprite.scale.x *= -1;
    }
  }

  onRender(dt: number) {
    this.sprite.position.set(...this.getPosition());
    this.sprite.update(dt);
  }

  onBeginContact(other: Entity) {
    if (other instanceof Diver) {
      other.damage(20);
    }
  }
}
