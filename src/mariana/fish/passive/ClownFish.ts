import { SCALE_MODES } from "@pixi/constants";
import { Sprite } from "@pixi/sprite";
import { Body, Capsule } from "p2";
import img_clownfish from "../../../../resources/images/fish/clownfish.png";
import Entity from "../../../core/entity/Entity";
import { degToRad, normalizeAngle } from "../../../core/util/MathUtil";
import { rBool, rDirection, rUniform } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { SonarTarget } from "../../hud/sonar/SonarTarget";
import { BaseFish } from "../BaseFish";
import { FishAim } from "../fish-systems/FishAim";
import { FishSubmersion } from "../fish-systems/FishSubmersion";
import { FlockingSystem } from "../fish-systems/FlockingSystem";
import { FlockingFish, School } from "../fish-systems/School";
import { StreamlineMovement } from "../fish-systems/StreamlineMovement";

const DRAG = 0.18;
const LIFT = 1.8;
const AIM_STIFFNESS = 4;
const AIM_DAMPING = 1;
const MIN_THRUST = 2.0;
const MAX_THRUST = 5.0;

// const ATTRACTION = 0.2;
const ALIGNMENT = 0.2;
const COHESION = 0.7;
const SEPARATION = 1.0;
const SEPARATION_DISTANCE = 1.5; // the distance fish try to stay from each other in meters
const AVOIDANCE = 1.0; // the distance fish try to stay from each other in meters
const ATTRACTION = 0.3; // the distance fish try to stay from each other in meters

export class ClownFish extends BaseFish implements Entity, FlockingFish {
  baseScale: number;
  tags = ["clownfish"];

  width = rUniform(0.5, 0.75);

  // fish subsystems
  flockingSystem: FlockingSystem;
  movement: StreamlineMovement;
  submersion: FishSubmersion;
  aim: FishAim;

  constructor(position: V2d) {
    super();
    const height = this.width * 0.5;
    this.dropValue = this.width * 3;

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

    this.aim = this.addChild(new FishAim(this, AIM_STIFFNESS, AIM_DAMPING));
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
        avoidance: AVOIDANCE,
        attraction: ATTRACTION,
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
    super.onSlowTick(dt);

    if (!this.isDestroyed) {
      if (rBool(0.5)) {
        this.flockingSystem.updateTargetVelocity();
      }
    }
  }

  onTick(dt: number) {
    if (this.isSurfaced()) {
      this.body.angle = this.getVelocity().angle;
    } else {
      const targetVelocity = this.flockingSystem.targetVelocity;
      this.aim.setAngle(targetVelocity.angle);

      const targetSpeed = targetVelocity.magnitude;
      const currentSpeed = this.getVelocity().magnitude;
      this.movement.setThrust((targetSpeed - currentSpeed) * 3);
    }
  }

  onDestroy() {}
}
