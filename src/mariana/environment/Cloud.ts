import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE } from "../constants";
import { getWind } from "./Sky";

const UPSCALE = 8;

export class Cloud extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(position: V2d, front: boolean = true) {
    super();

    const graphics = new Graphics();

    for (let i = 0; i < 8; i++) {
      graphics.beginFill(0xffffff, 0.8);
      const r = rUniform(1.5, 4) * UPSCALE;
      graphics.drawCircle(i * UPSCALE, -r, r);
      graphics.endFill();
    }
    graphics.scale.set(1 / UPSCALE);
    graphics.cacheAsBitmap = true;
    graphics.cacheAsBitmapResolution = 8;

    this.sprite = graphics;
    this.sprite.position.set(...position);
    this.sprite.layerName = front ? Layer.CLOUDS : Layer.CLOUDS2;
  }

  onRender(dt: number) {
    const wind = getWind(this.game!);
    this.sprite.x += dt * wind * 0.1;

    if (this.sprite.x > WORLD_RIGHT_EDGE + 50) {
      this.sprite.x = WORLD_LEFT_EDGE - 50;
    }
  }
}
