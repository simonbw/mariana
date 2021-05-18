import { Graphics } from "pixi.js";
import { Layer } from "../../mariana/config/layers";
import BaseEntity from "../entity/BaseEntity";
import Entity, { GameSprite } from "../entity/Entity";
import { Camera2d } from "./Camera2d";

/** For testing that my viewport code worked. */
export class ViewportDebugger extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(public camera: Camera2d) {
    super();

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_FRONT;
  }

  onRender() {
    this.sprite.clear();

    const viewport = this.camera.getWorldViewport();

    this.drawCircle(this.camera.x, this.camera.y, 0.5);
    this.drawCircle(viewport.left, viewport.top, 1.5);
    this.drawCircle(viewport.left, viewport.bottom, 1.5);
    this.drawCircle(viewport.right, viewport.top, 1.5);
    this.drawCircle(viewport.right, viewport.bottom, 1.5);
  }

  drawCircle(x: number, y: number, radius = 0.5, color = 0xff00ff) {
    this.sprite.beginFill(color);
    this.sprite.drawCircle(x, y, radius);
    this.sprite.endFill();
  }
}
