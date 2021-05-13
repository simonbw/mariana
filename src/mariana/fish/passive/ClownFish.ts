import { SCALE_MODES } from "@pixi/constants";
import { Sprite } from "@pixi/sprite";
import { Body, Capsule } from "p2";
import img_clownfish from "../../../../resources/images/fish/clownfish.png";
import Entity from "../../../core/entity/Entity";
import AimSpring from "../../../core/physics/AimSpring";
import { degToRad, normalizeAngle } from "../../../core/util/MathUtil";
import { rBool, rDirection, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { BaseFish } from "../BaseFish";
import { FishSubmersion } from "../fish-systems/FishSubmersion";
import { FlockingSystem } from "../fish-systems/FlockingSystem";
import { FlockingFish, School } from "../fish-systems/School";
import { StreamlineMovement } from "../fish-systems/StreamlineMovement";

const DRAG = 0.15;
const LIFT = 1.8;
const AIM_STIFFNESS = 10;
const AIM_DAMPING = 4;
const MIN_THRUST = 2.0;
const MAX_THRUST = 6.0;

// const ATTRACTION = 0.2;
const ALIGNMENT = 0.2;
const COHESION = 0.7;
const SEPARATION = 1.0;
const SEPARATION_DISTANCE = 1.5; // the distance fish try to stay from each other in meters

export class ClownFish extends BaseFish implements Entity, FlockingFish {
  aimSpring!: AimSpring;
  baseScale: number;

  width = rUniform(0.6, 0.9);

  // fish subsystems
  flockingSystem: FlockingSystem;
  movement: StreamlineMovement;
  submersion: FishSubmersion;

  constructor(position: V2d) {
    super();
    const height = this.width * 0.5;
    this.dropValue = this.width * 10;

    this.sprite = Sprite.from(img_clownfish, {
      scaleMode: SCALE_MODES.NEAREST,
    });
    this.baseScale = this.width / this.sprite.texture.width;
    this.sprite.scale.set(this.baseScale);
    this.sprite.anchor.set(0.5);

    this.body = new Body({
      position,
      mass: 0.2,
      angle: rDirection(),
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

    this.aimSpring = new AimSpring(this.body);
    this.aimSpring.damping = AIM_DAMPING;
    this.springs = [this.aimSpring];

    this.submersion = this.addChild(new FishSubmersion(this));
    this.movement = this.addChild(
      new StreamlineMovement(this, {
        drag: DRAG,
        lift: LIFT,
        minThrust: MIN_THRUST,
        maxThrust: MAX_THRUST,
      })
    );
    this.flockingSystem = this.addChild(
      new FlockingSystem(this, {
        cohesion: COHESION,
        alignment: ALIGNMENT,
        separation: SEPARATION,
        separationDistance: SEPARATION_DISTANCE,
      })
    );
  }

  joinSchool(school: School) {
    this.flockingSystem.school = school;
  }

  onRender() {
    this.sprite.position.set(...this.body!.position);

    const angle = normalizeAngle(this.body.angle);
    this.sprite.rotation = angle;
    const flip = angle < degToRad(-90) || angle > degToRad(90);
    this.sprite.scale.set(
      this.baseScale,
      flip ? -this.baseScale : this.baseScale
    );
  }

  onSlowTick(dt: number) {
    if (rBool(0.5)) {
      this.flockingSystem.updateTargetVelocity();
    }
  }

  onTick(dt: number) {
    if (this.isSurfaced()) {
      this.aimSpring.stiffness = 0; // free floatin
      this.body.angle = this.getVelocity().angle;
    } else {
      const targetVelocity = this.flockingSystem.targetVelocity;

      this.aimSpring.stiffness = AIM_STIFFNESS;
      this.aimSpring.restAngle = targetVelocity.angle;

      const targetSpeed = targetVelocity.magnitude;
      const currentSpeed = this.getVelocity().magnitude;
      this.movement.setThrust((targetSpeed - currentSpeed) * 3);
    }
  }

  onDestroy() {}
}
