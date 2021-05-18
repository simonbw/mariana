import {
  Body,
  Circle,
  Constraint,
  DistanceConstraint,
  LinearSpring,
  Spring,
} from "p2";
import Entity from "../../../core/entity/Entity";
import { clamp, degToRad, lerp, polarToVec } from "../../../core/util/MathUtil";
import { rDirection } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { getDiver } from "../../diver/Diver";
import { getWaves } from "../../environment/Waves";
import { BaseFish } from "../BaseFish";
import { EelSprite } from "./EelSprite";

const NUM_SEGMENTS = 24;
const SEGMENT_LENGTH = 0.5;

const HEAD_DRAG = 0.01;
const TAIL_DRAG = 0.015;
const HEAD_SPRINGY = 0.0;
const TAIL_SPRINGY = 0.0;

const WIGGLE_SPEED = 3.0;
const WIGGLE_AMOUNT = degToRad(40);
const MOVE_SPEED = 3;

// TODO: Damage diver
// TODO: Better springiness
/** An eel */
export class Eel extends BaseFish {
  tags = ["eel"];

  bodies: Body[] = [];
  springs: Spring[] = [];
  constraints: Constraint[] = [];

  directions: V2d[] = [];
  t = 0;

  constructor(position: V2d) {
    super({ dropValue: 20, hp: 50 });

    let lastPosition = position.clone();
    const direction = polarToVec(rDirection(), SEGMENT_LENGTH);
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const body = new Body({
        position: lastPosition.iadd(direction).clone(),
        mass: 0.01,
        // collisionResponse: false,
      });
      body.addShape(
        new Circle({
          radius: 0.2,
          collisionGroup: CollisionGroups.Fish,
          collisionMask: CollisionGroups.All,
        })
      );

      this.bodies.push(body);
      this.directions.push(V(1, 0));
    }

    for (let i = 1; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i];
      const bodyB = this.bodies[i - 1];
      const constraint = new DistanceConstraint(bodyA, bodyB, {
        distance: SEGMENT_LENGTH,
        collideConnected: false,
      });
      constraint.setStiffness(40);
      constraint.setRelaxation(8);
      this.constraints.push(constraint);

      if (i >= 2) {
        const bodyC = this.bodies[i - 2];
        const spring = new LinearSpring(bodyA, bodyC, {
          stiffness: 1000,
          restLength: SEGMENT_LENGTH * 2,
          damping: 1,
        });
        this.springs.push(spring);
      }
    }

    this.addChild(new EelSprite(this));
  }

  getPosition(): V2d {
    return this._position.set(this.bodies[0].position);
  }

  getVelocity(): V2d {
    return this._velocity.set(this.bodies[0].velocity);
  }

  private _friction = V(0, 0);
  onTick(dt: number) {
    this.t += dt * WIGGLE_SPEED;

    for (const i of this.bodies.keys()) {
      this.updateSegment(i);
    }

    this.moveTowardsDiver();
  }

  private _gravity = V(0, 0);
  updateSegment(i: number) {
    const p = (i - 1) / (this.bodies.length - 1);
    const body = this.bodies[i];
    const parent = this.bodies[i - 1];

    const drag = lerp(HEAD_DRAG, TAIL_DRAG, p);
    body.applyForce(this._friction.set(body.velocity).imul(-drag));

    const waves = getWaves(this.game!);
    if (!waves.isUnderwater(body.position)) {
      body.applyForce(this._gravity.set(0, 9.8 * body.mass));
    }
  }

  private _diverDirection = V(0, 0);
  moveTowardsDiver() {
    const diver = getDiver(this.game!);
    const head = this.bodies[0];

    this._diverDirection.set(head.position).isub(diver!.getPosition());
    const distance = this._diverDirection.magnitude;

    if (distance < 15) {
      const headDirection = this.directions[0];
      headDirection.set(this._diverDirection).inormalize();
      headDirection.angle += Math.cos(this.t * WIGGLE_SPEED) * WIGGLE_AMOUNT;

      if (distance > 1) {
        const p = clamp((this._diverDirection.magnitude - 1) / 10, 0, 1);
        const speed = MOVE_SPEED * p;
        head.applyForce(headDirection.mul(-speed));
      }
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

export function isEel(entity: Entity): entity is Eel {
  return entity instanceof Eel;
}
