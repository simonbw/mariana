import { BLEND_MODES } from "@pixi/constants";
import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { smootherStep } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { Layer } from "../config/layers";
import { getTimeOfDay } from "./TimeOfDay";

const NUM_STARS = 4000;

const UPSCALE = 4.0;
const ROTATION_POINT = 40;

export class Stars extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor() {
    super();

    this.sprite = new Graphics();
    this.sprite.position.set(0, ROTATION_POINT);

    const minX = -70;
    const maxX = 70;
    const minY = -70 - ROTATION_POINT;
    const maxY = 70 - ROTATION_POINT;

    for (let i = 0; i < NUM_STARS; i++) {
      const x = rUniform(minX, maxX) * UPSCALE;
      const y = rUniform(minY, maxY) * UPSCALE;
      const r = (0.025 + 0.05 * Math.random() ** 8) * UPSCALE;
      this.sprite.beginFill(0xffffff);
      this.sprite.drawCircle(x, y, r);
      this.sprite.endFill();
    }
    this.sprite.scale.set(1.0 / UPSCALE);

    this.sprite.blendMode = BLEND_MODES.ADD;
    this.sprite.layerName = Layer.STARS;
    // this.sprite.cacheAsBitmap = true; // this makes it not look as cool, but it might be good for performance
    this.sprite.cacheAsBitmapResolution = 8;
  }

  onRender(dt: number) {
    const timeOfDay = getTimeOfDay(this.game!);
    const nightPercent = timeOfDay.getNightPercent();
    this.sprite.alpha = smootherStep(nightPercent);

    this.sprite.rotation = (timeOfDay.hour / 24) * Math.PI * 2;
  }
}
