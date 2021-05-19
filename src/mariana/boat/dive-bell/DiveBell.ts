import { Body, Circle, LockConstraint, vec2 } from "p2";
import snd_metalHittingRock from "../../../../resources/audio/impacts/metal_hitting_rock.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundInstance } from "../../../core/sound/SoundInstance";
import { angleDelta, clamp, invLerp, lerp } from "../../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { getDiver } from "../../diver/Diver";
import { Harpoon } from "../../diver/weapons/Harpoon";
import { Harpoonable } from "../../diver/weapons/Harpoonable";
import { Bubble } from "../../effects/Bubble";
import { getWaves } from "../../environment/Waves";
import { GroundTile } from "../../plants/GroundTile";
import { DiveBellSprite } from "./DiveBellSprite";

export const DIVE_BELL_RADIUS = 1;
const WAVE_DEPTH_FACTOR = 0.95; // multiplier of wave velocity
const MAX_WAVE_FORCE = 3; // multiplier of wave velocity
const DRAG = 10.0;

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
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.World,
      })
    );
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS * 0.6,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.Harpoon,
        collisionResponse: false,
      })
    );

    this.addChild(new DiveBellSprite(this));
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
    const x = this.body.position[1];
    const surfaceHeight = waves.getSurfaceHeight(x);

    return this.body.position[1] - surfaceHeight;
  }

  getPercentSubmerged(): number {
    const depth = this.getDepth();
    return clamp(invLerp(-DIVE_BELL_RADIUS, DIVE_BELL_RADIUS, depth));
  }

  private _physics = V(0, 0);
  private _waveForce = V(0, 0);
  applyPhysics(dt: number) {
    const percentSubmerged = this.getPercentSubmerged();
    const depth = this.getDepth();

    // drag
    const drag = lerp(DRAG, DRAG * 0.1, percentSubmerged);
    this._physics.set(this.body.velocity).imul(-drag);

    // gravity
    const g = lerp(9.8, 0, percentSubmerged);
    this._physics.iadd([0, g * this.body.mass]);

    // waves
    const waves = getWaves(this.game!);
    const x = this.body.position[0];
    waves.getSurfaceVelocity(x, this._waveForce);
    const depthFactor = WAVE_DEPTH_FACTOR ** depth;
    const waveFactor = MAX_WAVE_FORCE * depthFactor * percentSubmerged;
    this._physics.iadd(this._waveForce.imul(waveFactor));

    this.body.applyForce(this._physics);

    // Angular damping
    this.body.angularVelocity *= Math.exp(-dt * 0.3);

    // Roll towards right-side-up
    this.body.angularVelocity += -0.1 * angleDelta(this.body.angle, 0) * dt;
  }

  // TODO: Tether to boat
  onRender(dt: number) {
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
      this.addChild(new BuoyHarpoonTether(this, harpoon));
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

export class BuoyHarpoonTether extends BaseEntity implements Entity {
  constructor(private buoy: DiveBell, private harpoon: Harpoon) {
    super();

    this.constraints = [new LockConstraint(buoy.body, harpoon.body)];
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
