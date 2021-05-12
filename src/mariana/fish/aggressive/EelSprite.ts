import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { degToRad, lerp } from "../../../core/util/MathUtil";
import { Eel } from "./Eel";

const WIDTH = 0.6;

export class EelSprite extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite = new Graphics();

  shouldDrawCenters = false;
  shouldDrawDirections = false;

  constructor(private eel: Eel) {
    super();
  }

  onRender(dt: number) {
    this.sprite.clear();

    const bodies = this.eel.bodies;
    this.sprite.lineStyle({
      width: WIDTH,
      color: 0x00cc00,
      miterLimit: degToRad(90),
    });
    this.sprite.moveTo(...bodies[0].position);
    for (let i = 1; i < bodies.length; i++) {
      const t = i / bodies.length;
      const body = bodies[i];
      this.sprite.lineTo(...body.position);
    }

    if (this.shouldDrawCenters) {
      this.sprite.lineStyle();
      for (const [i, body] of bodies.entries()) {
        const r = i === 0 ? 0.2 : 0.1;
        this.sprite.beginFill(0x009900);
        const [x, y] = body.position;
        this.sprite.drawCircle(x, y, r);
        this.sprite.endFill();
      }
    }

    if (this.shouldDrawDirections) {
      this.sprite.lineStyle({ width: 0.1, color: 0xff0000 });
      for (const [i, body] of bodies.entries()) {
        const [x, y] = body.position;
        const [dx, dy] = this.eel.getSegmentDirection(i);
        this.sprite.moveTo(x, y);
        this.sprite.lineTo(x + dx, y + dy);
      }
    }
  }
}
