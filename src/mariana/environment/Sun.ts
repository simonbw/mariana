import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { degToRad } from "../../core/util/MathUtil";
import { Layer } from "../config/layers";
import { getTimeOfDay } from "./Sky";

export class Sun extends BaseEntity implements Entity {
  constructor() {
    super();

    const graphics = new Graphics();

    graphics.beginFill(0xffff00);
    graphics.drawCircle(0, 0, 4);
    graphics.endFill();

    graphics.scale.set(1 / 4);

    // TODO: Mask from waves, and gradient mask
    const mask = new Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(-10000, -1000, 20000, 1000);
    mask.endFill();
    graphics.mask = mask;

    this.sprite = graphics;
    this.sprite.layerName = Layer.SUN;

    this.sprites = [mask];
  }

  onRender() {
    const t = degToRad(270) - (2 * Math.PI * getTimeOfDay(this.game!)) / 24;

    this.sprite!.x = 10 * Math.cos(t);
    this.sprite!.y = -5 * Math.sin(t);
  }
}
