import { Body, Circle, LockConstraint, vec2 } from "p2";
import snd_metalHittingRock from "../../../../resources/audio/impacts/metal_hitting_rock.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundInstance } from "../../../core/sound/SoundInstance";
import {
  angleDelta,
  clamp,
  invLerp,
  lerp,
  smootherStep,
} from "../../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { getDiver } from "../../diver/Diver";
import { Harpoon } from "../../diver/harpoon/Harpoon";
import { Harpoonable } from "../../diver/harpoon/Harpoonable";
import { Bubble } from "../../effects/Bubble";
import { getWaves } from "../../environment/Waves";
import { GroundTile } from "../../plants/GroundTile";
import { DiveBellSprite } from "./DiveBellSprite";
import { DiveBellTether } from "./DiveBellTether";

export const DIVE_BELL_RADIUS = 1;
const WAVE_DEPTH_FACTOR = 0.95; // multiplier of wave velocity
const MAX_WAVE_FORCE = 3; // multiplier of wave velocity
const DRAG = 1.0;

/** Provides the diver with oxygen */
export class DiveBell extends BaseEntity implements Entity, Harpoonable {
  id = "diveBell";
  body: Body;

  constructor(position: V2d) {
    super();

    this.body = new Body({
      mass: 1,
      position,
    });
    // regular collision shape
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.World,
      })
    );
    // smaller one for harpoon to stick in
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS * 0.6,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.Harpoon,
        collisionResponse: false,
      })
    );

    this.addChild(new DiveBellSprite(this));
    this.addChild(new DiveBellTether(this));
  }

  getFillRate() {
    return 10;
  }

  onTick(dt: number) {
    const diver = getDiver(this.game!);

    if (diver) {
      // TODO: Check distance to head
      const direction = diver.getPosition().sub(this.getPosition());
      if (direction.magnitude < DIVE_BELL_RADIUS + 2) {
        diver.air.giveOxygen(dt * this.getFillRate());
      }
    }

    this.applyPhysics(dt);
  }

  /** Return the current depth in meters under the surface */
  getDepth() {
    const waves = getWaves(this.game!);
    const [x, y] = this.body.position;
    const surfaceHeight = waves.getSurfaceHeight(x);

    return y - surfaceHeight;
  }

  /** Return the percent of the bell covered by water. */
  getPercentSubmerged(): number {
    const depth = this.getDepth();
    const percent = invLerp(-DIVE_BELL_RADIUS, DIVE_BELL_RADIUS, depth);
    return clamp(percent);
  }

  private _physics = V(0, 0);
  private _waveForce = V(0, 0);
  applyPhysics(dt: number) {
    const percentSubmerged = this.getPercentSubmerged();
    const depth = this.getDepth();

    // drag
    const drag = lerp(0.1 * DRAG, DRAG, percentSubmerged);
    this._physics.set(this.body.velocity).imul(-drag);

    // gravity
    const g = lerp(9.8, 0, percentSubmerged);
    this._physics.iadd([0, g * this.body.mass * 3]);

    // waves
    const waves = getWaves(this.game!);
    const x = this.body.position[0];
    waves.getSurfaceVelocity(x, this._waveForce);
    const depthFactor = WAVE_DEPTH_FACTOR ** depth;
    const waveFactor = MAX_WAVE_FORCE * depthFactor * percentSubmerged;
    // this._physics.iadd(this._waveForce.imul(waveFactor));

    this.body.applyForce(this._physics);

    // Angular damping
    this.body.angularVelocity *= Math.exp(-dt * 0.3 * percentSubmerged);

    // Roll towards right-side-up
    this.body.angularVelocity +=
      -0.1 * angleDelta(this.body.angle, 0) * dt * percentSubmerged;
  }

  onSlowTick(dt: number) {
    if (rBool(dt * 10)) {
      this.game!.addEntity(
        new Bubble(
          this.getPosition().iadd([rNormal(), rNormal()]),
          V(rNormal(), rNormal()),
          rUniform(0.3, 0.6)
        )
      );
    }
  }

  onHarpooned(harpoon: Harpoon) {
    if (harpoon.getDamageAmount() > 0) {
      this.addChild(new BellHarpoonConnection(this, harpoon));
    }
  }

  onBeginContact(other: Entity) {
    if (other instanceof GroundTile) {
      const gain = clamp(vec2.length(this.body.velocity) / 8) / 8;
      this.game!.addEntity(
        new SoundInstance(snd_metalHittingRock, {
          gain,
          speed: rUniform(0.7, 0.9),
        })
      );
    }
  }
}

export class BellHarpoonConnection extends BaseEntity implements Entity {
  constructor(bell: DiveBell, private harpoon: Harpoon) {
    super();

    this.constraints = [new LockConstraint(bell.body, harpoon.body)];
  }

  onTick() {
    const gun = this.harpoon.harpoonGun;
    if (gun.tether?.retracting && gun.tether.retractPercent >= 1.0) {
      this.destroy();
    } else {
      // ?
    }
  }
}
