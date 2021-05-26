import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { Body, Circle } from "p2";
import snd_electrocution from "../../../../resources/audio/fish/electrocution.flac";
import img_squid1 from "../../../../resources/images/fish/squid-1.png";
import img_squid2 from "../../../../resources/images/fish/squid-2.png";
import img_squid3 from "../../../../resources/images/fish/squid-3.png";
import Entity from "../../../core/entity/Entity";
import { OnContactingParams } from "../../../core/entity/EntityPhysics";
import { SoundInstance } from "../../../core/sound/SoundInstance";
import { degToRad, lerp } from "../../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Layer } from "../../config/layers";
import { Diver, getDiver } from "../../diver/Diver";
import { Bubble } from "../../effects/Bubble";
import { SonarTarget } from "../../hud/sonar/SonarTarget";
import { PointLight } from "../../lighting/PointLight";
import { BaseFish } from "../BaseFish";
import { FishAim } from "../fish-systems/FishAim";
import { FishSubmersion } from "../fish-systems/FishSubmersion";
import { School } from "../fish-systems/School";

const AIM_STIFFNESS = 10;
const AIM_DAMPING = 5;
const DRAG = 0.8;
const THRUST = 8;
const ATTACK_RANGE = 10;
const DAMAGE = 20;

const LIGHT_STING_INTENSITY = 0.8;
const LIGHT_STING_SIZE = 6;
const LIGHT_INTENSITY = 0.1;
const LIGHT_SIZE = 3;
const STING_DURATION = 1.5;

export default class Jellyfish extends BaseFish implements Entity {
  tags = ["jellyfish"];

  size: number;
  targetVelocity: V2d = V(0, 0);
  squidging = false;
  baseScale: number;

  textures = [
    Texture.from(img_squid1),
    Texture.from(img_squid2),
    Texture.from(img_squid3),
  ];
  light: PointLight;
  stinging: boolean = false;
  aim: FishAim;

  constructor(position: V2d, school?: School) {
    super();
    this.size = rUniform(2, 2.5);
    this.dropValue = this.size * 4;

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

    this.aim = this.addChild(new FishAim(this, AIM_STIFFNESS, AIM_DAMPING));

    this.addChild(new FishSubmersion(this));

    this.light = this.addChild(
      new PointLight({
        position,
        size: LIGHT_SIZE,
        intensity: LIGHT_INTENSITY,
        color: 0xff55bb,
      })
    );

    this.addChild(new SonarTarget(() => this.getPosition()));
  }

  private _friction = V(0, 0);
  onTick(dt: number) {
    const diver = getDiver(this.game!);

    this._friction.set(this.body.velocity).imul(-DRAG);
    this.body.applyForce(this._friction);

    if (diver && diver.isSubmerged()) {
      const direction = diver.getPosition().isub(this.getPosition());
      if (direction.magnitude < ATTACK_RANGE) {
        this.aim.setAngle(direction.angle);

        if (!this.squidging && !this.stinging) {
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
    this.aim.disable();

    await this.wait(1, (dt, t) => {
      this._thrust.set(THRUST * (1 - t), 0);
      this._thrust.angle = this.body.angle;
      this.body.applyForce(this._thrust);

      if (rBool((1 - t) * 0.2)) {
        this.game!.addEntity(
          new Bubble(
            this.localToWorld([-0.3, rNormal()]),
            this.getVelocity().imul(-rNormal(0.25, 0.1)),
            rUniform(0.05, 0.1),
            Layer.WORLD_BACK
          )
        );
      }
    });

    this.aim.enable();
    this.sprite.texture = this.textures[0];
    await this.wait(1);

    this.squidging = false;
  }

  onRender() {
    const position = this.getPosition();
    this.sprite.position.set(position[0], position[1]);
    this.sprite.rotation = this.body.angle + degToRad(90);
    this.light.setPosition(position);
  }

  onContacting({ other }: OnContactingParams) {
    if (other instanceof Diver) {
      if (!this.stinging && !other.isDead) {
        this.sting();
      }
    }
  }

  async sting() {
    this.stinging = true;
    const diver = getDiver(this.game!);
    this.game?.addEntity(new SoundInstance(snd_electrocution, { gain: 0.5 }));
    if (diver && this.body.overlaps(diver.body)) {
      diver.damage(DAMAGE);
    }

    this.light.intensity = LIGHT_STING_INTENSITY;
    this.light.size = LIGHT_STING_SIZE;
    await this.wait(STING_DURATION, (dt, t) => {
      this.light.intensity = lerp(
        LIGHT_STING_INTENSITY,
        LIGHT_INTENSITY,
        t ** 0.5
      );
      this.light.size = lerp(LIGHT_STING_SIZE, LIGHT_SIZE, t ** 0.5);
    });
    this.light.size = LIGHT_SIZE;
    this.light.intensity = LIGHT_INTENSITY;

    this.stinging = false;
  }
}
