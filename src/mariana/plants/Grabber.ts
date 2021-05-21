import { Graphics } from "@pixi/graphics";
import { Body, LinearSpring, RotationalSpring } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { last } from "../../core/util/FunctionalUtils";
import { lerp } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { getDiver } from "../diver/Diver";

const NUM_BODIES = 10;

export class Grabber extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(position: V2d) {
    super();

    this.sprite = new Graphics();

    this.bodies = [];
    this.springs = [];

    for (let i = 0; i < NUM_BODIES; i++) {
      const body = new Body({
        position: position.add([i, 0]),
        mass: 0.1,
      });
      this.bodies.push(body);
    }
    this.bodies[0].mass = 0;
    this.bodies[0].type = Body.STATIC;

    for (let i = 1; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i - 1];
      const bodyB = this.bodies[i];

      const linearSpring = new LinearSpring(bodyA, bodyB);
      const rotationalSpring = new RotationalSpring(bodyA, bodyB);
      this.springs.push(linearSpring, rotationalSpring);
    }
  }

  onTick() {
    const diver = getDiver(this.game!);
    if (diver) {
      const tip = last(this.bodies!);

      const tipForce = diver.getPosition().isub(this.getTip()).inormalize(10);
      tip.applyForce(tipForce);
    }
  }

  private _tip = V(0, 0);
  getTip(): V2d {
    const tip = last(this.bodies!).position;
    return this._tip.set(tip[0], tip[1]);
  }

  onRender() {
    this.sprite.clear();

    const bodies = this.bodies!;
    this.sprite.moveTo(...bodies[0].position);
    for (let i = 1; i < bodies.length; i++) {
      const t = i / bodies.length;
      const body = bodies[i];
      this.sprite.lineStyle({
        width: lerp(1.0, 0.1, t),
        color: 0x00cc00,
        miterLimit: Infinity,
      });
      this.sprite.lineTo(...body.position);
    }
  }
}
