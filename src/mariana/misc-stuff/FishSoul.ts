import { Body, Particle } from "p2";
import { AnimatedSprite, Texture } from "pixi.js";
import snd_bellPositive1 from "../../../resources/audio/ui/bell_positive_1.flac";
import snd_bellPositive2 from "../../../resources/audio/ui/bell_positive_2.flac";
import img_pickup1 from "../../../resources/images/particles/pickup-1.png";
import img_pickup2 from "../../../resources/images/particles/pickup-2.png";
import img_pickup3 from "../../../resources/images/particles/pickup-3.png";
import img_pickup4 from "../../../resources/images/particles/pickup-4.png";
import img_pickup5 from "../../../resources/images/particles/pickup-5.png";
import img_pickup6 from "../../../resources/images/particles/pickup-6.png";
import img_pickup7 from "../../../resources/images/particles/pickup-7.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { rBool, rInteger, rNormal, rRound } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import { Diver, getDiver } from "../diver/Diver";
import { PointLight } from "../lighting/PointLight";
import { getUpgradeManager } from "../upgrade/UpgradeManager";

const MAGNET_FORCE = 5;
const GRAVITY = 3; // meters / sec^2
const FRICTION = 2; // meters / sec^2
const GLOW_PERIOD = 1; // seconds

export class FishSoul extends BaseEntity implements Entity {
  sprite: AnimatedSprite & GameSprite;
  body: Body;
  light: PointLight;

  t = Math.random();

  constructor(position: V2d, public value: number = 1) {
    super();

    this.sprite = AnimatedSprite.fromImages([
      img_pickup1,
      img_pickup2,
      img_pickup3,
      img_pickup4,
      img_pickup5,
      img_pickup6,
      img_pickup7,
    ]);

    this.sprite.tint = 0xddff99;
    this.sprite.alpha = 0.7;
    this.sprite.layerName = Layer.GLOW;

    this.sprite.anchor.set(0.5);
    this.sprite.width = this.sprite.height = 0.5 + Math.sqrt(value) * 0.1;
    this.sprite.animationSpeed = 8;

    this.body = new Body({ mass: 0.01, fixedRotation: true, position });
    this.body.addShape(
      new Particle({
        collisionMask: CollisionGroups.World | CollisionGroups.Diver,
      })
    );

    this.light = this.addChild(
      new PointLight({
        position: this.getPosition(),
        size: 2,
        color: 0xaaffaa,
      })
    );
  }

  getMagnetRadius() {
    if (getUpgradeManager(this.game!).hasUpgrade("soulMagnet")) {
      return 8;
    } else {
      return 4;
    }
  }

  // TODO: Don't allocate
  onTick(dt: number) {
    this.t = (this.t + dt / GLOW_PERIOD) % 1;

    this.body.applyForce([0, GRAVITY * this.body!.mass]);
    this.body.applyForce(
      V(this.body.velocity).imul(-FRICTION * this.body.mass)
    );

    const diver = getDiver(this.game);

    if (diver && !diver.isDead) {
      const offset = diver.getPosition().isub(this.getPosition());
      const distance = offset.magnitude;

      const magnetRadius = this.getMagnetRadius();
      if (distance < magnetRadius) {
        const percent = ((magnetRadius - distance) / magnetRadius) ** 2;
        const force = percent * MAGNET_FORCE;
        this.body.applyForce(offset.inormalize().imul(force));
      }
    }
  }

  onBeginContact(other: Entity) {
    if (other instanceof Diver && !other.isDead) {
      const sound = this.value > 5 ? snd_bellPositive2 : snd_bellPositive1;
      this.game?.addEntity(new SoundInstance(sound, { gain: 0.05 }));
      this.game?.dispatch({ type: "fishSoulCollected", value: this.value });
      this.destroy();
    }
  }

  onRender() {
    this.sprite.position.set(...this.body.position);

    const textures = this.sprite.textures;
    this.sprite.texture = textures[
      Math.floor(this.t * textures.length)
    ] as Texture;

    this.light.setPosition(this.body.position);
    this.light.intensity = 0.12 + 0.03 * Math.sin(this.t * 2 * Math.PI);
  }
}

// Make a cluster of drops
export function makeSoulDrops(position: V2d, value: number = 1): FishSoul[] {
  const pickups: FishSoul[] = [];
  let valueRemaining = rRound(value);
  while (valueRemaining > 1) {
    const value = rInteger(1, valueRemaining);
    valueRemaining -= value;
    pickups.push(new FishSoul(position.add([rNormal(), rNormal()]), value));
  }
  if (rBool(valueRemaining)) {
    pickups.push(new FishSoul(position.add([rNormal(), rNormal()]), 1));
  }
  return pickups;
}
