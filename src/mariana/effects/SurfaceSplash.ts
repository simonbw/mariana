import { Sprite } from "pixi.js";
import img_waterSplash from "../../../resources/images/particles/water-splash.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { polarToVec } from "../../core/util/MathUtil";
import { rDirection, rRound, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves, WATER_COLOR } from "../environment/Waves";

const FRICTION = 0.8;
const GRAVITY = 9.8;

export class SplashParticle extends BaseEntity implements Entity {
  constructor(
    position: V2d,
    velocity?: V2d,
    private size: number = rUniform(0.06, 0.18)
  ) {
    super();

    if (velocity) {
      this._velocity.set(velocity);
    }

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

  onSlowTick(dt: number) {
    const waves = getWaves(this.game!);
    const sprite = this.sprite! as Sprite;

    this._velocity.imul(Math.exp(-dt * FRICTION));
    this._velocity.iadd([0, GRAVITY * dt]);

    sprite.x += dt * this._velocity[0];
    sprite.y += dt * this._velocity[1];

    sprite.scale.set(this.size / sprite.texture.width);
    // sprite.tint = colorLerp(sprite.tint, 0xffffff, clamp(dt * 4));

    if (sprite.y >= waves.getSurfaceHeight(sprite.x)) {
      this.destroy();
    }
  }
}

export class SurfaceSplash extends BaseEntity implements Entity {
  constructor(
    private x: number,
    private speed: number,
    private size: number = 1.0
  ) {
    super();
  }

  onAdd(game: Game) {
    const waves = getWaves(game);
    const n = rRound(this.speed ** 0.7 * this.size);
    for (let i = 0; i < n; i++) {
      const x = rUniform(-0.3, 0.3) + this.x;
      const y = waves.getSurfaceHeight(x);
      const surfaceAngle = waves.getSurfaceAngle(x);
      polarToVec(
        rUniform(-Math.PI, Math.PI) + surfaceAngle,
        rUniform(0.5, 1) * this.speed,
        this._velocity
      );
      game!.addEntity(new SplashParticle(V(x, y), this._velocity));
    }
  }

  onTick() {
    this.destroy();
  }
}
