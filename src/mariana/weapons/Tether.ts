import { Body, DistanceConstraint, Particle } from "p2";
import { Graphics } from "pixi.js";
import snd_reelInHarpoon from "../../../resources/audio/weapons/reel_in_harpoon.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundName } from "../../core/resources/sounds";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { V } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Diver } from "../diver/Diver";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { Harpoon } from "./Harpoon";

const TETHER_LENGTH = 13.0; // meters
const NUM_SEGMENTS = 25; // segments in the rope
const TURBO_RETRACT_TIME = 0.5; // seconds
const AUTO_RETRACT_TIME = 1; // seconds
const MANUAL_RETRACT_TIME = 3; // seconds
const FRICTION = 0.001;

const SEGMENT_LENGTH = TETHER_LENGTH / (NUM_SEGMENTS + 1);

const HARPOON_TETHER_OFFSET = V(-0.45, 0);

export class Tether extends BaseEntity implements Entity {
  sprite: Graphics;
  retracting = false;
  constraints: DistanceConstraint[];

  constructor(public diver: Diver, public harpoon: Harpoon) {
    super();

    this.sprite = new Graphics();

    this.bodies = [];

    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const body = new Body({
        mass: 0.002,
        position: diver.getPosition(),
        velocity: [...diver.body.velocity],
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

    this.constraints = [];
    this.constraints.push(new DistanceConstraint(diver.body, this.bodies[0]));

    for (let i = 0; i < NUM_SEGMENTS - 1; i++) {
      const bodyA = this.bodies[i];
      const bodyB = this.bodies[i + 1];
      const constraint = new DistanceConstraint(bodyA, bodyB);
      this.constraints.push(constraint);
    }

    this.constraints.push(
      new DistanceConstraint(harpoon.body!, this.bodies[NUM_SEGMENTS - 1], {
        localAnchorA: HARPOON_TETHER_OFFSET,
      })
    );

    for (const constraint of this.constraints) {
      constraint.lowerLimitEnabled = false;
      constraint.upperLimitEnabled = true;
      constraint.upperLimit = SEGMENT_LENGTH;
      constraint.setStiffness(10 ** 9);
      constraint.setRelaxation(2);
    }
  }

  hasAutoretractor(): boolean {
    return getUpgradeManager(this.game!).hasUpgrade("autoRetractor");
  }

  hasTurboretractor(): boolean {
    return getUpgradeManager(this.game!).hasUpgrade("turboRetractor");
  }

  getRetractorLevel(): 0 | 1 | 2 {
    if (getUpgradeManager(this.game!).hasUpgrade("turboRetractor")) {
      return 2;
    } else if (getUpgradeManager(this.game!).hasUpgrade("autoRetractor")) {
      return 1;
    } else {
      return 0;
    }
  }

  getRetractTime() {
    switch (this.getRetractorLevel()) {
      case 0:
        return MANUAL_RETRACT_TIME;
      case 1:
        return AUTO_RETRACT_TIME;
      case 2:
        return TURBO_RETRACT_TIME;
    }
  }

  getRetractSound(): SoundName {
    switch (this.getRetractorLevel()) {
      case 0:
        return snd_reelInHarpoon;
      case 1:
        return snd_reelInHarpoon;
      case 2:
        return snd_reelInHarpoon;
    }
  }

  async retract() {
    this.retracting = true;

    this.game!.addEntity(
      new SoundInstance(this.getRetractSound(), { gain: 0.05 })
    );

    const waitTime = this.getRetractTime() / NUM_SEGMENTS;
    for (let i = 0; i < this.constraints.length; i++) {
      await this.wait(waitTime, (dt, t) => {
        this.constraints[i].upperLimit = SEGMENT_LENGTH * (1.0 - t);
      });
    }

    await this.waitUntil(
      () =>
        this.getHarpoonPosition().isub(this.getHoldPosition()).magnitude < 0.3,
      (dt) => {
        const force = this.getHoldPosition()
          .isub(this.getHarpoonPosition())
          .imul(5.0);
        this.harpoon.body.applyForce(force);

        // extra friction to slow down the spinny junk
        const v = V(this.harpoon.body.velocity).isub(this.diver.body.velocity);
        this.harpoon.body.applyForce(v.imul(-0.1));
        this.harpoon.body.angularVelocity *= Math.exp(-dt);
      }
    );
  }

  onTick(dt: number) {
    for (const body of this.bodies!) {
      const f = -1 * FRICTION;
      body.applyForce([body.velocity[0] * f, body.velocity[1] * f]);
      body.applyForce([0, body.mass * 9.8]);
    }
  }

  getHoldPosition() {
    return this.diver.getPosition();
  }

  getHarpoonPosition() {
    return this.harpoon.localToWorld(HARPOON_TETHER_OFFSET);
  }

  onRender() {
    this.sprite.clear();
    this.sprite.lineStyle(0.04, 0x000000, 0.95);
    const [diverX, diverY] = this.getHoldPosition();
    const [harpoonX, harpoonY] = this.harpoon.localToWorld(V(-0.45, 0));

    this.sprite.moveTo(diverX, diverY);

    for (const body of this.bodies!) {
      this.sprite.lineTo(body.position[0], body.position[1]);
    }

    this.sprite.lineTo(harpoonX, harpoonY);
  }
}
