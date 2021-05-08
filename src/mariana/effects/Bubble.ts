import { vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_bubble from "../../../resources/images/particles/bubble.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWorldMap } from "../world/WorldMap";
import { SurfaceSplash } from "./SurfaceSplash";
import { getWaves } from "./Waves";

const FRICTION = 1.5;
const RISE_SPEED = 16; // meters / sec ^ 2

const MINIMUM_BREATHING_SIZE = 1;
export class Bubble extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    private velocity: V2d = V(0, 0),
    private size: number = rNormal(0.22, 0.1)
  ) {
    super();

    const sprite = (this.sprite = Sprite.from(img_bubble));
    sprite.position.set(position[0], position[1]);
    sprite.scale.set(size / sprite.texture.width);
    sprite.anchor.set(0.5);
    sprite.alpha = 0.7;

    this.sprite.layerName = Layer.WORLD_EXTRA_FRONT;
  }

  onSlowTick(dt: number) {
    if (
      !getWorldMap(this.game!)!.worldPointIsLoaded([
        this.sprite.x,
        this.sprite.y,
      ])
    ) {
      this.destroy();
      return;
    }

    const sprite = this.sprite! as Sprite;
    this.velocity[1] += dt * -RISE_SPEED;

    this.velocity.imul(Math.exp(-dt * FRICTION));

    this.size *= Math.exp(dt * 0.01);

    sprite.x += dt * this.velocity[0];
    sprite.y += dt * this.velocity[1];

    sprite.scale.set(this.size / sprite.texture.width);

    // if (this.size > MINIMUM_BREATHING_SIZE) {
    //   const diver = getDiver(this.game);
    //   if (diver) {
    //     const dist = diver?.getPosition().isub(this.getPosition()).magnitude;
    //     if (dist < this.size + 0.5) {
    //       diver.air.giveOxygen(dt);
    //     }
    //   }
    // }

    const waves = getWaves(this.game!);
    const x = sprite.x;
    const surfaceY = waves.getSurfaceHeight(x);

    if (sprite.y <= surfaceY) {
      const speed = vec2.len(this.velocity);
      this.game!.addEntity(new SurfaceSplash(sprite.x, speed / 2, this.size));
      this.destroy();
    }
  }
}
