import { Body, Particle } from "p2";
import snd_bellPositive1 from "../../../resources/audio/ui/bell_positive_1.flac";
import snd_bellPositive2 from "../../../resources/audio/ui/bell_positive_2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { rBool, rInteger, rNormal, rRound } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Diver, getDiver } from "../diver/Diver";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { FishSoulSprite } from "./FishSoulSprite";

const MAGNET_FORCE = 5;
const GRAVITY = 3; // meters / sec^2
const FRICTION = 2; // meters / sec^2

export class FishSoul extends BaseEntity implements Entity {
  body: Body;
  soulSprite: FishSoulSprite;

  constructor(position: V2d, public value: number = 1) {
    super();

    this.body = new Body({ mass: 0.01, fixedRotation: true, position });
    this.body.addShape(
      new Particle({
        collisionMask: CollisionGroups.World | CollisionGroups.Diver,
      })
    );

    this.soulSprite = this.addChild(new FishSoulSprite(value));
  }

  getMagnetRadius() {
    if (getUpgradeManager(this.game!).hasUpgrade("soulMagnet")) {
      return 8;
    } else {
      return 4;
    }
  }

  onTick() {
    this.body.applyForce(
      this.getVelocity()
        .imul(-FRICTION * this.body.mass)
        .iadd([0, GRAVITY * this.body.mass])
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
    this.soulSprite.setPosition(this.getPosition());
  }
}

/** Make a cluster of drops */
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
