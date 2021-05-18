import { vec2 } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { lerp } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { Boat } from "../boat/Boat";
import { getWaves } from "../environment/Waves";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { Diver } from "./Diver";

const BASE_SPEED = 12.0; // Newtons?
const SPEED_PER_UPGRADE = 4.0; // Newtons?
const SURFACE_GRAVITY = 9.8; // meters / second^2
const MAX_WAVE_FORCE = 3; // multiplier of wave velocity
const WAVE_DEPTH_FACTOR = 0.95; // multiplier of wave velocity
const AIR_FRICTION = 0.5; // some sort of units
const WATER_FRICTION = 2.2; // some sort of units

export class DiverPhysics extends BaseEntity implements Entity {
  constructor(private diver: Diver) {
    super();
  }

  onTick() {
    const diver = this.diver;

    if (diver.onBoat) {
      this.beOnBoat();
    } else {
      this.diver.body.collisionResponse = true;
      this.applyGravity();
      this.applyFriction();
      this.applyWaveForces();
      this.applyMovement();
    }
  }

  private beOnBoat() {
    const body = this.diver.body;
    const boat = this.game!.entities.getById("boat") as Boat;
    vec2.copy(body.position, boat.getLaunchPosition());
    vec2.set(body.velocity, 0, 0);
    body.collisionResponse = false;
  }

  private _gravity = V(0, 0);
  applyGravity() {
    const diver = this.diver;
    const submergedG = 0.0;
    const g = lerp(SURFACE_GRAVITY, submergedG, diver.getPercentSubmerged());
    diver.body.applyForce(this._gravity.set(0, g * diver.body.mass));
  }

  private _friction = V(0, 0);
  applyFriction() {
    const body = this.diver.body;

    const amount = -lerp(
      AIR_FRICTION,
      WATER_FRICTION,
      this.diver.getPercentSubmerged()
    );
    body.applyForce(this._friction.set(body.velocity).imul(amount));
  }

  private _waveForce = V(0, 0);
  applyWaveForces() {
    const depth = this.diver.getDepth();
    const percentSubmerged = this.diver.getPercentSubmerged();

    const waves = getWaves(this.game!);
    const x = this.diver.body.position[0];
    waves.getSurfaceVelocity(x, this._waveForce);

    const depthFactor = WAVE_DEPTH_FACTOR ** depth;
    const f = this._waveForce.imul(
      MAX_WAVE_FORCE * depthFactor * percentSubmerged
    );
    this.diver.body.applyForce(f);
  }

  private _moveForce = V(0, 0);
  applyMovement() {
    this._moveForce.set(this.diver.moveDirection).imul(this.getMaxSpeed());

    this.diver.body.applyForce(this._moveForce);
  }

  getMaxSpeed(): number {
    const upgradeManager = getUpgradeManager(this.game!)!;

    let speed = BASE_SPEED;
    if (upgradeManager.hasUpgrade("flippers1")) {
      speed += SPEED_PER_UPGRADE;
    }
    if (upgradeManager.hasUpgrade("flippers2")) {
      speed += SPEED_PER_UPGRADE;
    }

    return speed * this.diver.getPercentSubmerged();
  }
}
