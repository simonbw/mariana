import { Body, Box } from "p2";
import { AnimatedSprite } from "pixi.js";
import img_angler1 from "../../../resources/images/angler_1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rBool, rInteger } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Diver } from "../Diver";
import { UpgradePickup } from "../UpgradePickup";
import { Harpoon } from "../weapons/Harpoon";
import { Harpoonable } from "../weapons/Harpoonable";

const SPEED = 5;
const FRICTION = 2.0;
const PATROL_TIME = 5.0; // seconds travelled in each direction
const WIDTH = 3;
const HEIGHT = 1;

export class AnglerFish extends BaseEntity implements Entity, Harpoonable {
  sprite: AnimatedSprite & GameSprite;
  body: Body;

  movingRight = rBool();

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 1, collisionResponse: false });
    this.body.addShape(
      new Box({
        width: WIDTH,
        height: HEIGHT,
        collisionMask: CollisionGroups.All,
      })
    );
    this.body.position = position;

    this.sprite = AnimatedSprite.fromImages([img_angler1]);

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

  async onAdd() {
    await this.wait(Math.random() * PATROL_TIME);
    this.turnAround();
  }

  async turnAround() {
    this.sprite.scale.x *= -1;
    this.movingRight = !this.movingRight;

    await this.wait(PATROL_TIME);
    this.turnAround();
  }

  onRender(dt: number) {
    this.sprite.position.set(...this.body!.position);
    this.sprite.update(dt);
  }

  onTick(dt: number) {
    const direction = this.movingRight ? 1 : -1;
    this.body.applyForce([direction * SPEED, 0]);

    this.body.applyForce(V(this.body.velocity).imul(-FRICTION));
  }

  onBeginContact(other: Entity) {
    if (other instanceof Diver) {
      other.damage(20);
    }
  }

  onHarpooned(harpoon: Harpoon) {
    this.game!.addEntity(new UpgradePickup(this.getPosition(), rInteger(2, 4)));
    this.destroy();
  }
}
