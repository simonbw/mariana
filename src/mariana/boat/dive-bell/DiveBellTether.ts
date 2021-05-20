import { Graphics } from "@pixi/graphics";
import bspline from "b-spline";
import { Body, DistanceConstraint, Particle } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import { DiveBell } from "./DiveBell";

const NUM_SEGMENTS = 50;
const NUM_SPLINE_STEPS = 400;
const SEGMENT_LENGTH = 1;
const FRICTION = 0.001;

export class DiveBellTether extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  constraints: DistanceConstraint[] = [];
  bodies: Body[] = [];

  constructor(private diveBell: DiveBell) {
    super();

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_BACK;

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const body = new Body({
        mass: 0.002,
        position: diveBell.getPosition(),
        velocity: [...diveBell.body.velocity],
        collisionResponse: true,
        fixedRotation: true,
      });
      body.addShape(
        new Particle({
          collisionGroup: CollisionGroups.Harpoon,
          collisionMask: CollisionGroups.World,
        })
      );
      this.bodies.push(body);
    }
    this.constraints.push(
      new DistanceConstraint(diveBell.body, this.bodies[0])
    );

    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      const bodyA = this.bodies[i];
      const bodyB = this.bodies[i + 1];
      const constraint = new DistanceConstraint(bodyA, bodyB);
      this.constraints.push(constraint);
    }

    for (const constraint of this.constraints) {
      constraint.lowerLimitEnabled = false;
      constraint.upperLimitEnabled = true;
      constraint.upperLimit = SEGMENT_LENGTH;
      constraint.setStiffness(10 ** 9);
      constraint.setRelaxation(2);
    }
  }

  onAdd(game: Game) {
    this.constraints.push(
      new DistanceConstraint(game.ground!, this.bodies[NUM_SEGMENTS - 1], {
        localAnchorA: [0, 0],
      })
    );
  }

  onTick(dt: number) {
    for (const body of this.bodies!) {
      const f = -1 * FRICTION;
      body.applyForce([body.velocity[0] * f, body.velocity[1] * f]);
      body.applyForce([0, body.mass * 9.8]);
    }
  }

  onRender() {
    this.sprite.clear();
    this.sprite.lineStyle({ width: 0.2, color: 0x004400 });
    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = [0, 0];

    this.sprite.moveTo(bellX, bellY);

    const points: [number, number][] = [];
    points.push([bellX, bellY]);
    for (const body of this.bodies) {
      points.push(body.position);
    }
    points.push([boatX, boatY]);

    const stepSize = 1.0 / NUM_SPLINE_STEPS;
    for (let t = stepSize; t < 1; t += stepSize) {
      const [x, y] = bspline(t, 2, points);
      this.sprite.lineTo(x, y);
    }
    this.sprite.lineTo(boatX, boatY);
  }
}
