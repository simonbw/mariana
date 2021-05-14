import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { degToRad } from "../../core/util/MathUtil";
import { Layer } from "../config/layers";

export class Sun extends BaseEntity implements Entity {
  constructor(private getTimeOfDay: () => number) {
    super();

    const graphics = new Graphics();

    // graphics.beginFill(0xffff00);
    // graphics.drawCircle(0, 0, 4);
    // graphics.endFill();

    graphics.scale.set(1 / 4);

    this.sprite = graphics;
    this.sprite.layerName = Layer.SUN;
  }

  onRender() {
    const hour = this.getTimeOfDay();
    const t = degToRad(270) - (2 * Math.PI * hour) / 24;

    this.sprite!.x = 10 * Math.cos(t);
    this.sprite!.y = -5 * Math.sin(t);
  }
}
