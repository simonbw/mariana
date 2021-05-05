import { Sprite } from "pixi.js";
import img_waterSplash from "../../../resources/images/particles/water-splash.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp } from "../../core/util/MathUtil";
import { rDirection, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves, WATER_COLOR } from "./Waves";

const FRICTION = 0.8;
const GRAVITY = 9.8;

export class SplashParticle extends BaseEntity implements Entity {
  constructor(
    position: V2d,
    private velocity: V2d = V(0, 0),
    private size: number = rUniform(0.06, 0.18)
  ) {
    super();

    const sprite = (this.sprite = Sprite.from(img_waterSplash));
    sprite.position.set(position[0], position[1]);
    sprite.scale.set(size / sprite.texture.width);
    sprite.rotation = rDirection();
    sprite.alpha = 1.0;
    sprite.anchor.set(0.5);
    sprite.tint = WATER_COLOR;

    this.sprite.layerName = Layer.WORLD_FRONT;
  }

  async onAdd() {
    await this.wait(rUniform(4, 6), (dt, t) => {
      this.sprite!.alpha = (1.0 - t) ** 2 * 0.7;
    });
    this.destroy();
  }

  onTick(dt: number) {
    const waves = getWaves(this.game!);
    const sprite = this.sprite! as Sprite;

    this.velocity.imul(Math.exp(-dt * FRICTION));
    this.velocity.iadd([0, GRAVITY * dt]);

    sprite.x += dt * this.velocity[0];
    sprite.y += dt * this.velocity[1];

    sprite.scale.set(this.size / sprite.texture.width);
    sprite.tint = colorLerp(sprite.tint, 0xffffff, clamp(dt * 4));

    if (sprite.y >= waves.getSurfaceHeight(sprite.x)) {
      this.destroy();
    }
  }
}
