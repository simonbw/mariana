import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import img_daylight from "../../../resources/images/lights/daylight.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { colorLerp } from "../../core/util/ColorUtils";
import { lerp } from "../../core/util/MathUtil";
import { WORLD_BOTTOM, WORLD_SIZE_METERS } from "../constants";
import { Light } from "../lighting/Light";
import { SUNRISE, SUNSET } from "./Sky";

export class Daylight extends BaseEntity implements Entity {
  lightSprite: Sprite;
  sky: Graphics;

  constructor(private getTimeOfDay: () => number) {
    super();

    this.sky = new Graphics();
    this.sky.blendMode = BLEND_MODES.ADD;

    this.lightSprite = Sprite.from(img_daylight);
    this.lightSprite.anchor.set(0.5, 0);
    this.lightSprite.width = WORLD_SIZE_METERS[0] * 2;
    this.lightSprite.height = WORLD_BOTTOM * 0.3;
    this.lightSprite.blendMode = BLEND_MODES.ADD;

    this.lightSprite.addChild(this.sky);

    this.addChild(new Light(this.lightSprite));
  }

  onRender() {
    const hour = this.getTimeOfDay();

    const color = getSkyColor(hour);
    this.lightSprite.tint = color;
    this.sky.clear();
    this.sky.beginFill(color);
    this.sky.drawRect(-1000, -1000, 2000, 1000);
    this.sky.endFill();
  }
}

export function getSkyColor(hour: number): number {
  if (hour < SUNRISE) {
    return 0xaaaaff;
  } else if (hour < SUNRISE + 1) {
    return colorLerp(0xaaaaff, 0xffffff, hour - SUNRISE);
  } else if (hour < SUNSET) {
    return 0xffffff;
  } else if (hour < SUNSET + 1) {
    return colorLerp(0xffffff, 0xaaaaff, hour - SUNSET);
  } else {
    return 0xaaaaff;
  }
}
