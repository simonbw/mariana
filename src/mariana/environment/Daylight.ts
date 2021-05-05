import { BLEND_MODES, Graphics, Sprite } from "pixi.js";
import img_daylight from "../../../resources/images/lights/daylight.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { lerp } from "../../core/util/MathUtil";
import { WORLD_BOTTOM, WORLD_SIZE_METERS } from "../constants";
import { Light } from "../lighting/Light";
import { getTimeOfDay } from "./Sky";

const DAY_ALPHA = 1.0;
const NIGHT_ALPHA = 1.0;

export class Daylight extends BaseEntity implements Entity {
  lightSprite: Sprite;

  constructor() {
    super();

    const sky = new Graphics();
    sky.beginFill(0xffffff);
    sky.drawRect(-1000, -1000, 2000, 1000);
    sky.endFill();
    sky.blendMode = BLEND_MODES.ADD;

    this.lightSprite = Sprite.from(img_daylight);
    this.lightSprite.anchor.set(0.5, 0);
    this.lightSprite.width = WORLD_SIZE_METERS[0] * 2;
    this.lightSprite.height = WORLD_BOTTOM * 0.3;
    this.lightSprite.blendMode = BLEND_MODES.ADD;

    this.lightSprite.addChild(sky);

    this.addChild(new Light(this.lightSprite));
  }

  onRender() {
    const day = getTimeOfDay(this.game!);
    const lightPercent = (Math.cos(Math.PI * 2 * day) + 1) / 2;

    this.lightSprite.alpha = lerp(NIGHT_ALPHA, DAY_ALPHA, lightPercent);
  }
}
