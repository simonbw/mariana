import { SCALE_MODES } from "@pixi/constants";
import { Sprite } from "@pixi/sprite";
import { Body, Capsule } from "p2";
import img_clownfish from "../../../resources/images/fish/clownfish.png";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import AimSpring from "../../core/physics/AimSpring";
import { clamp, clampUp, polarToVec } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { getDiver } from "../diver/Diver";
import { SurfaceSplash } from "../effects/SurfaceSplash";
import { getWaves } from "../effects/Waves";
import { BaseFish } from "./BaseFish";
import { FlockingFish, School } from "./School";

const DRAG = 0.15;
const LIFT = 1.8;
const AIM_STIFFNESS = 3;
const MIN_THRUST = 2.0;
const MAX_THRUST = 6.0;

const ALIGNMENT = 0.7;
const COHESION = 0.5;
const SEPARATION = 1.0;
const MAX_SEPARATION = 1.5;

export class ClownFish extends BaseFish implements Entity, FlockingFish {
  aimSpring!: AimSpring;
  baseScale: number;
  school: School | undefined;
  wasSubmerged = true;

  width = rUniform(0.6, 0.9);
  targetVelocity: V2d = V(0, 0);

  // Store these to reduce allocations
  position: V2d = V(0, 0);
  velocity: V2d = V(0, 0);

  constructor(position: V2d, school?: School) {
    super();
    const height = this.width * 0.5;
    this.dropValue = this.width * 10;

    this.school = school;

    this.sprite = Sprite.from(img_clownfish, {
      scaleMode: SCALE_MODES.NEAREST,
    });
    this.baseScale = this.width / this.sprite.texture.width;
    this.sprite.scale.set(this.baseScale);
    this.sprite.anchor.set(0.5);

    this.body = new Body({
      position,
      mass: 0.2,
    });

    this.body.addShape(
      new Capsule({
        length: this.width - height,
        radius: height / 2,
        angle: Math.PI,
        collisionGroup: CollisionGroups.Fish,
        collisionMask: CollisionGroups.World | CollisionGroups.Harpoon,
      })
    );
  }

  getPosition(): V2d {
    return this.position.set(this.body.position);
  }

  getVelocity(): V2d {
    return this.velocity.set(this.body.velocity);
  }

  onAdd(game: Game) {
    this.aimSpring = new AimSpring(game.ground, this.body);
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

  // TODO: Make this faster
  updateTargetVelocity() {
    if (this.school) {
      const toCenter = this.school.center.sub(this.getPosition());

      const averageVel = this.school.velocity;

      const separating = V(0, 0);
      const pos = this.getPosition();
      for (const other of this.school.getNeighbors(pos, MAX_SEPARATION)) {
        const away = pos.sub(other.getPosition());
        away.magnitude = clampUp(MAX_SEPARATION - away.magnitude) ** 2;
        separating.iadd(away);
      }

      this.targetVelocity
        .set(0, 0)
        .iadd(toCenter.imul(COHESION))
        .iadd(averageVel.imul(ALIGNMENT))
        .iadd(separating.imul(SEPARATION));
    } else {
      const diver = getDiver(this.game!)!;
      const toDiver = diver.getPosition().isub(this.body.position);
      this.targetVelocity.set(toDiver.inormalize(3));
    }
  }

  getThrust(currentSpeed: number, targetSpeed: number) {
    return clamp((targetSpeed - currentSpeed) * 3, MIN_THRUST, MAX_THRUST);
  }

  onSlowTick(dt: number) {
    this.updateTargetVelocity();
    const waves = getWaves(this.game!);
    const [x, y] = this.getPosition();
    const surfaceY = waves.getSurfaceHeight(x);
    const isSubmerged = y > surfaceY;

    if (isSubmerged != this.wasSubmerged) {
      this.game?.addEntity(new SurfaceSplash(x, this.getVelocity().magnitude));
    }

    this.wasSubmerged = isSubmerged;
  }

  // store here to avoid allocating
  private _heading = V(1, 0);
  private _normal = V(0, 1);
  private _thrust = V(0, 0);
  private _drag = V(0, 0);
  private _lift = V(0, 0);
  private _force = V(0, 0);

  // TODO: Make this faster
  onTick(dt: number) {
    if (this.body.position[1] < 0) {
      this.aimSpring.stiffness = 0; // free floatin
      this.body.applyForce([0, 9.8 * this.body.mass]);
      this.body.angle = this.getVelocity().angle;
    } else {
      this.aimSpring.stiffness = AIM_STIFFNESS;
      this.aimSpring.restAngle = this.targetVelocity.angle;

      const velocity = this.getVelocity();

      this._heading.angle = this.body.angle;
      this._heading.inormalize();
      this._normal.set(this._heading).irotate90ccw();

      // from the fish swimming
      const thrust = this.getThrust(
        velocity.magnitude,
        this.targetVelocity.magnitude
      );
      const drag = velocity.dot(this._heading) * -DRAG;
      const lift = this._normal.dot(velocity) * -LIFT;

      this._thrust.set(this._heading).imul(thrust);
      this._drag.set(this._heading).imul(drag);
      this._lift.set(this._normal).imul(lift);

      this._force.set(this._thrust).iadd(this._drag).iadd(this._lift);
      this.body.applyForce(this._force);
    }
  }
}
