import { Sprite } from "@pixi/sprite";
import { Body, Capsule } from "p2";
import img_clownfish from "../../../resources/images/fish/clownfish.png";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import AimSpring from "../../core/physics/AimSpring";
import { polarToVec } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { getDiver } from "../diver/Diver";
import { BaseFish } from "./BaseFish";

const THRUST = 1.2;
const DRAG = 0.2;
const LIFT = 0.8;
const AIM_STIFFNESS = 10;

export class ClownFish extends BaseFish implements Entity {
  aimSpring!: AimSpring;
  baseScale: number;

  constructor(position: V2d) {
    const width = rUniform(0.6, 0.9);
    const height = width * 0.5;
    super(position, {
      width: width,
      height: width * 0.5,
      dropValue: width * 10,
    });

    this.sprite = Sprite.from(img_clownfish);
    this.baseScale = this.width / this.sprite.texture.width;
    this.sprite.scale.set(this.baseScale);
    this.sprite.anchor.set(0.5);

    this.body = new Body({
      position,
      mass: 0.2,
    });

    this.body.addShape(
      new Capsule({
        length: width - height,
        radius: height / 2,
        angle: Math.PI,
        collisionGroup: CollisionGroups.Fish,
        collisionMask: CollisionGroups.World,
      })
    );
  }

  onAdd(game: Game) {
    this.aimSpring = new AimSpring(this.body, game.ground);
    this.springs = [this.aimSpring];
  }

  onRender() {
    this.sprite.position.set(...this.body!.position);

    const heading = polarToVec(this.body.angle, 1);
    if (heading[0] >= 0) {
      this.sprite.scale.set(this.baseScale, this.baseScale);
      this.sprite.rotation = heading.angle;
    } else {
      this.sprite.scale.set(this.baseScale, -this.baseScale);
      this.sprite.rotation = heading.angle;
    }
  }

  onTick(dt: number) {
    if (this.body.position[1] < 0) {
      this.aimSpring.stiffness = 0; // free floatin
      this.body.applyForce([0, 9.8 * this.body.mass]);
    } else {
      this.aimSpring.stiffness = AIM_STIFFNESS;
      const diver = getDiver(this.game!)!;
      const targetDirection = diver.getPosition().isub(this.body.position)
        .angle;
      this.aimSpring.restAngle = -targetDirection;

      const velocity = V(this.body.velocity);

      const heading = polarToVec(this.body.angle, 1);
      const normal = heading.rotate90ccw();

      // from the fish swimming
      const thrust = THRUST;
      const drag = velocity.dot(heading) * DRAG;
      const lift = normal.dot(velocity) * LIFT;

      this.body.angle = heading.angle;
      this.body.applyForce(heading.mul(thrust));
      this.body.applyForce(heading.mul(-drag));
      this.body.applyForce(normal.mul(-lift));
    }
  }
}
