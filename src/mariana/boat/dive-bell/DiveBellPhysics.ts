import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { angleDelta, lerp } from "../../../core/util/MathUtil";
import { V } from "../../../core/Vector";
import { getWaves } from "../../environment/Waves";
import { DiveBell } from "./DiveBell";

const DRAG = 1.0; // Water drag
const ANGULAR_FRICTION = 0.5; // rotational water drag
const RIGHTING_TORQUE = 0.2; // How strong it tries to right itself
const WAVE_DEPTH_FACTOR = 0.95; // multiplier of wave velocity
const MAX_WAVE_FORCE = 1; // multiplier of wave velocity

export class DiveBellPhysics extends BaseEntity implements Entity {
  constructor(public diveBell: DiveBell) {
    super();
  }

  private _physics = V(0, 0);
  private _waveForce = V(0, 0);
  onTick(dt: number) {
    const diveBell = this.diveBell;
    const body = diveBell.body;
    const percentSubmerged = diveBell.getPercentSubmerged();
    const depth = diveBell.getDepth();

    // drag
    const drag = lerp(0.1 * DRAG, DRAG, percentSubmerged);
    this._physics.set(body.velocity).imul(-drag);

    // gravity
    const g = lerp(9.8, 0, percentSubmerged);
    this._physics.iadd([0, g * body.mass * 3]);

    // waves
    const waves = getWaves(this.game!);
    const x = body.position[0];
    waves.getSurfaceVelocity(x, this._waveForce);
    const depthFactor = WAVE_DEPTH_FACTOR ** depth;
    const waveFactor = MAX_WAVE_FORCE * depthFactor * percentSubmerged;
    this._physics.iadd(this._waveForce.imul(waveFactor));

    body.applyForce(this._physics);

    // Angular damping
    body.angularVelocity *= Math.exp(-dt * ANGULAR_FRICTION * percentSubmerged);

    // Roll towards right-side-up
    body.angularVelocity +=
      -RIGHTING_TORQUE * angleDelta(body.angle, 0) * dt * percentSubmerged;
  }
}
