import { AnimatedSprite } from "pixi.js";
import img_angler1 from "../../../resources/images/fish/angler_1.png";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Diver } from "../diver/Diver";
import { PointLight } from "../lighting/PointLight";
import { GroundTile } from "../world/GroundTile";
import { BaseFish } from "./BaseFish";

const SPEED = 5;
const FRICTION = 2.0;
const PATROL_TIME = 5.0; // seconds travelled in each direction
const WIDTH = 3;
const HEIGHT = 1;

export class AnglerFish extends BaseFish {
  sprite: AnimatedSprite & GameSprite;

  movingRight = rBool();
  light: PointLight;

  t = Math.random();

  constructor(position: V2d) {
    super({ hp: 20, dropValue: 50 });

    this.sprite = AnimatedSprite.fromImages([img_angler1]);

    this.sprite.animationSpeed = 1;
    this.sprite.autoUpdate = false;
    this.sprite.play();

    this.sprite.scale.set(WIDTH / this.sprite.texture.width);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(...position);

    this.light = this.addChild(new PointLight({ position, size: 2 }));
  }

  onBeginContact(other: Entity) {
    if (other instanceof Diver) {
      other.damage(20);
    }
  }

  getLightPosition() {
    const x = this.facingRight ? 0.82 : -0.82;
    return this.localToWorld([x, -0.78]);
  }

  onRender(dt: number) {
    this.sprite.position.set(...this.getPosition());
    this.light.setPosition(this.getLightPosition());
    this.light.intensity = 0.6 + 0.2 * Math.sin(this.t);
  }

  onDestroy() {
    console.log("angler fish dead");
  }
}
