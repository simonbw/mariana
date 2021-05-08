import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { Body, Circle, ContactEquation, Shape } from "p2";
import snd_electrocution from "../../../resources/audio/fish/electrocution.flac";
import img_squid1 from "../../../resources/images/fish/squid-1.png";
import img_squid2 from "../../../resources/images/fish/squid-2.png";
import img_squid3 from "../../../resources/images/fish/squid-3.png";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import AimSpring from "../../core/physics/AimSpring";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { degToRad } from "../../core/util/MathUtil";
import { rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Diver, getDiver } from "../diver/Diver";
import { BaseFish } from "./BaseFish";
import { FishSubmersion } from "./fish-systems/FishSubmersion";
import { School } from "./fish-systems/School";

const AIM_STIFFNESS = 100;
const AIM_DAMPING = 100;
const DRAG = 0.8;
const THRUST = 8;
const ATTACK_RANGE = 10;

export default class Squidger extends BaseFish implements Entity {
  aimSpring!: AimSpring;
  baseScale: number;

  size = rUniform(2, 2.5);
  targetVelocity: V2d = V(0, 0);
  squidging = false;

  textures = [
    Texture.from(img_squid1),
    Texture.from(img_squid2),
    Texture.from(img_squid3),
  ];

  constructor(position: V2d, school?: School) {
    super();
    this.dropValue = this.size * 10;

    this.sprite = new Sprite(this.textures[0]);
    this.baseScale = this.size / this.sprite.texture.width;
    this.sprite.scale.set(this.baseScale);
    this.sprite.anchor.set(0.5);

    this.body = new Body({
      position,
      mass: 0.2,
      angle: rNormal(degToRad(270), degToRad(50)),
    });
    // regular collisions
    this.body.addShape(
      new Circle({
        radius: this.size * 0.4,
        collisionGroup: CollisionGroups.Fish,
        collisionMask: CollisionGroups.World | CollisionGroups.Harpoon,
      })
    );
    // damaging the diver collisions
    this.body.addShape(
      new Circle({
        radius: this.size * 0.5,
        collisionGroup: CollisionGroups.Fish,
        collisionMask: CollisionGroups.Diver,
        collisionResponse: false,
      })
    );

    this.aimSpring = new AimSpring(this.body);
    this.aimSpring.stiffness = AIM_STIFFNESS;
    this.aimSpring.damping = AIM_DAMPING;
    this.springs = [this.aimSpring];

    this.addChild(new FishSubmersion(this));
  }

  private _friction = V(0, 0);
  onTick(dt: number) {
    const diver = getDiver(this.game!);

    this._friction.set(this.body.velocity).imul(-DRAG);
    this.body.applyForce(this._friction);

    if (diver) {
      const direction = diver.getPosition().isub(this.getPosition());
      if (direction.magnitude < ATTACK_RANGE) {
        this.aimSpring.restAngle = direction.angle;

        if (!this.squidging) {
          this.squidge();
        }
      }
    }
  }

  private _thrust = V(0, 0);
  async squidge() {
    this.squidging = true;
    this.sprite.texture = this.textures[1];
    await this.wait(1);
    this.sprite.texture = this.textures[2];
    this.aimSpring.stiffness = 0;

    await this.wait(1, (dt, t) => {
      this._thrust.set(THRUST * (1 - t), 0);
      this._thrust.angle = this.body.angle;
      this.body.applyForce(this._thrust);
    });
    this.aimSpring.stiffness = AIM_STIFFNESS;
    this.sprite.texture = this.textures[0];
    await this.wait(1);

    this.squidging = false;
  }

  onRender() {
    this.sprite.position.set(...this.getPosition());
    this.sprite.rotation = this.body.angle + degToRad(90);
  }

  onBeginContact(
    other: Entity,
    a: Shape,
    b: Shape,
    equations: ContactEquation[]
  ) {
    if (other instanceof Diver) {
      other.damage(20);
      this.game?.addEntity(new SoundInstance(snd_electrocution, { gain: 0.5 }));
    }
  }
}
