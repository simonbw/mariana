import { Body, Box } from "p2";
import { Sprite } from "pixi.js";
import snd_fleshHit1 from "../../../resources/audio/impacts/flesh-hit-1.flac";
import snd_fleshHit2 from "../../../resources/audio/impacts/flesh-hit-2.flac";
import snd_fleshHit3 from "../../../resources/audio/impacts/flesh-hit-3.flac";
import snd_fleshHit4 from "../../../resources/audio/impacts/flesh-hit-4.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { BloodSplash } from "../effects/BloodSplash";
import { makeSoulDrops } from "../FishSoul";
import { ShuffleRing } from "../utils/ShuffleRing";
import { Harpoon } from "../weapons/Harpoon";
import { Harpoonable } from "../weapons/Harpoonable";

interface Options {
  width: number;
  height: number;
  speed?: number;
  friction?: number;
  dropValue?: number;
  hp?: number;
}

const HIT_SOUNDS = new ShuffleRing([
  snd_fleshHit1,
  snd_fleshHit2,
  snd_fleshHit3,
  snd_fleshHit4,
]);

export abstract class BaseFish
  extends BaseEntity
  implements Entity, Harpoonable {
  sprite!: Sprite & GameSprite;
  body!: Body;
  facingRight = true;

  speed: number;
  friction: number;
  dropValue: number;
  hp: number;

  constructor({
    speed = 3,
    friction = 2,
    dropValue = 1,
    hp = 10,
  }: Options = {}) {
    super();

    this.speed = speed;
    this.friction = friction;
    this.dropValue = dropValue;
    this.hp = hp;
  }

  onTick(dt: number) {
    this.body.applyForce(V(this.body.velocity).imul(-this.friction));

    // gravity when above water
    if (this.body.position[1] < 0) {
      this.body.applyForce([0, 9.8 * this.body.mass]);
    }
  }

  onRender() {
    if (this.sprite && this.body) {
      this.sprite.position.set(...this.body.position);
    }
  }

  // when we're hit
  onHarpooned(harpoon: Harpoon) {
    const damage = harpoon.getDamageAmount();
    if (damage > 0) {
      this.game!.addEntity(new SoundInstance(HIT_SOUNDS.getNext()));
      this.game!.addEntity(
        new BloodSplash(
          this.getPosition(),
          harpoon.getVelocity().imul(0.1),
          undefined,
          rUniform(0.4, 0.6)
        )
      );

      this.hp -= damage;
      if (this.hp <= 0) {
        this.die();
      }
    }
  }

  die() {
    this.game!.addEntity(new BloodSplash(this.getPosition()));
    this.game!.addEntity(
      new BloodSplash(
        this.getPosition(),
        V(this.body.velocity),
        undefined,
        rUniform(0.7, 1.1)
      )
    );
    this.game!.addEntities(makeSoulDrops(this.getPosition(), this.dropValue));
    this.destroy();
  }
}

export function isFish(entity: Entity): entity is BaseFish {
  return entity instanceof BaseFish;
}
