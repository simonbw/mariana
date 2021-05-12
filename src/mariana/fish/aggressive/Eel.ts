import { Body, Constraint, DistanceConstraint, Particle, Spring } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { lerp } from "../../../core/util/MathUtil";
import { rBool } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { getDiver } from "../../diver/Diver";
import { EelSprite } from "./EelSprite";

const NUM_SEGMENTS = 24;
const SEGMENT_LENGTH = 0.9;

const HEAD_DRAG = 0.01;
const TAIL_DRAG = 0.05;
const HEAD_SPRINGY = 1.0;
const TAIL_SPRINGY = 0.0;

const WIGGLE_SPEED = 3.0;
const WIGGLE_AMOUNT = 0.5;
const MOVE_SPEED = 3;

export class Eel extends BaseEntity implements Entity {
  bodies: Body[] = [];
  springs: Spring[] = [];
  constraints: Constraint[] = [];

  directions: V2d[] = [];
  t = 0;

  constructor(position: V2d) {
    super();

    this.addChild(new EelSprite(this));

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const body = new Body({
        position: position.add([i * SEGMENT_LENGTH, 0]),
        mass: 0.01,
        collisionResponse: false,
      });
      body.addShape(new Particle());

      this.bodies.push(body);
      this.directions.push(V(1, 0));
    }

    for (let i = 1; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i - 1];
      const bodyB = this.bodies[i];
      const constraint = new DistanceConstraint(bodyA, bodyB, {
        distance: SEGMENT_LENGTH,
      });
      constraint.setStiffness(40);
      constraint.setRelaxation(8);
      this.constraints.push(constraint);
    }
  }

  private _friction = V(0, 0);

  // TODO: don't allocate
  onTick(dt: number) {
    this.t += dt * WIGGLE_SPEED;

    for (const [i, body] of this.bodies.entries()) {
      const p = (i - 1) / (this.bodies.length - 1);
      const parent = this.bodies[i - 1];

      const drag = lerp(HEAD_DRAG, TAIL_DRAG, p);
      body.applyForce(V(body.velocity).imul(-drag));

      if (parent) {
        const springiness = lerp(HEAD_SPRINGY, TAIL_SPRINGY, p);

        const direction = this.directions[i];
        const parentDirection = this.directions[i - 1];
        direction.set(parent.position).isub(body.position).inormalize();

        const lateralDot = direction.dot(parentDirection.rotate90cw());
        const forwardDot = direction.dot(parentDirection);

        const amount = springiness * lateralDot;

        if (rBool(0.01) && forwardDot < 0) {
          console.log("negative");
        }

        const springForce = direction.rotate90cw().imul(amount);

        body.applyForce(springForce);
      }
    }

    this.moveTowardsDiver();
  }

  private _diverDirection = V(0, 0);
  moveTowardsDiver() {
    const diver = getDiver(this.game!);
    const head = this.bodies[0];

    this._diverDirection.set(head.position).isub(diver!.getPosition());
    this._diverDirection.angle +=
      Math.cos(this.t * WIGGLE_SPEED) * WIGGLE_AMOUNT;
    this.directions[0].set(this._diverDirection).inormalize();

    if (this._diverDirection.magnitude > 1) {
      head.applyForce(this.directions[0].mul(-MOVE_SPEED));
    }
  }

  getSegmentDirection(i: number): V2d {
    const direction = this.directions[i];
    if (i > 0) {
      // don't mess with the head
      direction
        .set(this.bodies[i].position)
        .isub(this.bodies[i - 1].position)
        .inormalize(SEGMENT_LENGTH);
    }
    return direction;
  }
}
