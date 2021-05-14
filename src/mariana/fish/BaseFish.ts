import { Body } from "p2";
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
import { BloodSplash } from "../effects/BloodSplash";
import { getWaves } from "../environment/Waves";
import { makeSoulDrops } from "../FishSoul";
import { ShuffleRing } from "../utils/ShuffleRing";
import { Harpoon } from "../weapons/Harpoon";
import { Harpoonable } from "../weapons/Harpoonable";
import { getWorldMap } from "../world/WorldMap";

interface Options {
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

  dropValue: number;
  hp: number;

  constructor({ dropValue = 1, hp = 10 }: Options = {}) {
    super();

    this.dropValue = dropValue;
    this.hp = hp;
  }

  protected _position = V(0, 0);
  getPosition(): V2d {
    return this._position.set(this.body.position);
  }

  protected _velocity = V(0, 0);
  getVelocity(): V2d {
    return this._velocity.set(this.body.velocity);
  }

  isSurfaced() {
    const waves = getWaves(this.game!);
    const [x, y] = this.getPosition();
    return y < waves.getSurfaceHeight(x);
  }

  onSlowTick(dt: number) {
    this.destroyIfUnloaded();
  }

  /** Destroys the fish if it's not in the loaded part of the world. Returns whether or not it did the destroying. */
  destroyIfUnloaded(): boolean {
    const worldMap = getWorldMap(this.game!)!;
    if (!worldMap.worldPointIsLoaded(this.getPosition())) {
      this.destroy();
      return true;
    }
    return false;
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
        this.getVelocity(),
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
