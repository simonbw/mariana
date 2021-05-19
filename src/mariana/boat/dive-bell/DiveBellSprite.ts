import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { Layer } from "../../config/layers";
import { PointLight } from "../../lighting/PointLight";
import { DiveBell, DIVE_BELL_RADIUS } from "./DiveBell";

export class DiveBellSprite extends BaseEntity implements Entity {
  sprite: GameSprite & Sprite;
  lights: PointLight[];
  constructor(public diveBell: DiveBell) {
    super();

    const upscale = 4;
    const r = DIVE_BELL_RADIUS * upscale;
    const graphics = new Graphics();
    graphics.lineStyle({ width: 0.1 * upscale, color: 0x444400 });
    graphics.beginFill(0xffff00);
    graphics.drawCircle(0, 0, r);
    graphics.endFill();
    graphics.lineStyle();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, 0, r / 2);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, -(r / 2), r / 8);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, r / 2, r / 8);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(-(r / 2), 0, r / 8);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(r / 2, 0, r / 8);
    graphics.endFill();
    graphics.scale.set(1 / upscale);

    this.sprite = new Sprite();
    this.sprite.addChild(graphics);
    this.sprite.layerName = Layer.WORLD_BACK;

    this.lights = [new PointLight({ size: 2, intensity: 3 })];
  }

  onRender(dt: number) {
    this.sprite.position.set(...this.diveBell.body.position);
    this.sprite.rotation = this.diveBell.body.angle;

    const p = this.diveBell.getPosition();
    for (const [i, light] of this.lights.entries()) {
      light.setPosition(p);
    }
  }
}
