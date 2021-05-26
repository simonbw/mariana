import { timeStamp } from "console";
import { vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_bubble from "../../../resources/images/particles/bubble.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { lerp } from "../../core/util/MathUtil";
import { rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves } from "../environment/Waves";
import { getWorldMap } from "../world/WorldMap";
import { SurfaceSplash } from "./SurfaceSplash";

const BUOYANCY = 100; // dunno the units, higher rises faster
const FRICTION = 5.0; // again, dunno the units, higher lowers the max speed
const LIFESPAN = 25; // seconds to stay around, so we don't end up with too many bubbles

/** A bubble particle that floats to the surface or until it hit's land or is unloaded */
export class Bubble extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    velocity?: V2d,
    private size: number = rNormal(0.22, 0.1),
    layerName: Layer = Layer.WORLD_FRONT
  ) {
    super();

    if (velocity) {
      this._velocity.set(velocity);
    }

    const sprite = (this.sprite = Sprite.from(img_bubble));
    sprite.position.set(...position);
    sprite.scale.set(size / sprite.texture.width);
    sprite.anchor.set(0.5);
    sprite.alpha = 0.7;

    this.sprite.layerName = layerName;
  }

  async onAdd() {
    await this.wait(LIFESPAN * (this.size + 0.1), (dt, t) => {
      this.sprite.alpha = lerp(0.7, 0, t ** 2);
    });
    this.destroy();
  }

  onSlowTick(dt: number) {
    const worldMap = getWorldMap(this.game!)!;
    const tilePos = worldMap.worldToTile([this.sprite.x, this.sprite.y]);
    if (
      worldMap.groundMap.tileIsSolid(tilePos) ||
      !worldMap.tileIsLoaded(tilePos)
    ) {
      this.destroy();
      return;
    }

    const sprite = this.sprite! as Sprite;
    this._velocity[1] += dt * -BUOYANCY * this.size ** 2;

    this._velocity.imul(Math.exp(-dt * FRICTION * this.size));

    this.size *= Math.exp(dt * 0.01);

    sprite.x += dt * this._velocity[0];
    sprite.y += dt * this._velocity[1];

    sprite.scale.set(this.size / sprite.texture.width);

    const waves = getWaves(this.game!);
    if (waves.isAbovewater([sprite.x, sprite.y])) {
      const speed = vec2.len(this._velocity);
      this.game!.addEntity(new SurfaceSplash(sprite.x, speed / 2, this.size));
      this.destroy();
    }
  }
}
