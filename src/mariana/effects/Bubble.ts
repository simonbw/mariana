import { vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_bubble from "../../../resources/images/particles/bubble.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves } from "../environment/Waves";
import { getWorldMap } from "../world/WorldMap";
import { SurfaceSplash } from "./SurfaceSplash";

const FRICTION = 1.5;
const RISE_SPEED = 16; // meters / sec ^ 2

/** A bubble particle that floats to the surface or until it hit's land or is unloaded */
export class Bubble extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  constructor(
    position: V2d,
    private velocity: V2d = V(0, 0),
    private size: number = rNormal(0.22, 0.1)
  ) {
    super();

    const sprite = (this.sprite = Sprite.from(img_bubble));
    sprite.position.set(...position);
    sprite.scale.set(size / sprite.texture.width);
    sprite.anchor.set(0.5);
    sprite.alpha = 0.7;

    this.sprite.layerName = Layer.WORLD_FRONTER;
  }

  onSlowTick(dt: number) {
    const worldMap = getWorldMap(this.game)!;
    const tilePos = worldMap.worldToTile([this.sprite.x, this.sprite.y]);
    if (
      worldMap.groundMap.tileIsSolid(tilePos) ||
      !worldMap.tileIsLoaded(tilePos)
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

    const waves = getWaves(this.game!);
    if (waves.isAbovewater([sprite.x, sprite.y])) {
      const speed = vec2.len(this.velocity);
      this.game!.addEntity(new SurfaceSplash(sprite.x, speed / 2, this.size));
      this.destroy();
    }
  }
}
