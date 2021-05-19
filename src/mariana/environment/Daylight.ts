import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import img_daylight from "../../../resources/images/lights/daylight.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { colorLerp } from "../../core/util/ColorUtils";
import { invLerp } from "../../core/util/MathUtil";
import { WORLD_BOTTOM, WORLD_SIZE_METERS } from "../constants";
import { Light } from "../lighting/Light";
import {
  getTimeOfDay,
  SUNRISE_END,
  SUNRISE_MID,
  SUNRISE_START,
  SUNSET_END,
  SUNSET_MID,
  SUNSET_START,
} from "./TimeOfDay";

export class Daylight extends BaseEntity implements Entity {
  lightSprite: Sprite;
  sky: Graphics;

  constructor() {
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
    const hour = getTimeOfDay(this.game!).hour;

    const color = getSkyColor(hour);
    this.lightSprite.tint = color;
    this.sky.clear();
    this.sky.beginFill(color);
    this.sky.drawRect(-1000, -1000, 2000, 1000);
    this.sky.endFill();
  }
}

const NIGHT_COLOR = 0xaaaaff;
const SUNRISE_COLOR = 0xffcccc;
const DAY_COLOR = 0xffffff;
const SUNSET_COLOR = 0xffccaa;

/**  */
export function getSkyColor(hour: number): number {
  if (hour < SUNRISE_START) {
    return NIGHT_COLOR;
  } else if (hour < SUNRISE_MID) {
    const t = invLerp(SUNRISE_START, SUNRISE_MID, hour);
    return colorLerp(NIGHT_COLOR, SUNRISE_COLOR, t);
  } else if (hour < SUNRISE_END) {
    const t = invLerp(SUNRISE_MID, SUNRISE_END, hour);
    return colorLerp(SUNRISE_COLOR, DAY_COLOR, t);
  } else if (hour < SUNSET_START) {
    return DAY_COLOR;
  } else if (hour < SUNSET_MID) {
    const t = invLerp(SUNSET_START, SUNSET_MID, hour);
    return colorLerp(DAY_COLOR, SUNSET_COLOR, t);
  } else if (hour < SUNSET_END) {
    const t = invLerp(SUNSET_MID, SUNSET_END, hour);
    return colorLerp(SUNSET_COLOR, NIGHT_COLOR, t);
  } else {
    return NIGHT_COLOR;
  }
}
