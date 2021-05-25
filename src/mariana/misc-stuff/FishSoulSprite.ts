import { AnimatedSprite, Texture } from "pixi.js";
import img_pickup1 from "../../../resources/images/particles/pickup-1.png";
import img_pickup2 from "../../../resources/images/particles/pickup-2.png";
import img_pickup3 from "../../../resources/images/particles/pickup-3.png";
import img_pickup4 from "../../../resources/images/particles/pickup-4.png";
import img_pickup5 from "../../../resources/images/particles/pickup-5.png";
import img_pickup6 from "../../../resources/images/particles/pickup-6.png";
import img_pickup7 from "../../../resources/images/particles/pickup-7.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { PointLight } from "../lighting/PointLight";

const GLOW_PERIOD = 1; // seconds

export class FishSoulSprite extends BaseEntity implements Entity {
  sprite: AnimatedSprite & GameSprite;
  light: PointLight;
  t = Math.random();

  constructor(public value: number = 1) {
    super();

    this.sprite = AnimatedSprite.fromImages([
      img_pickup1,
      img_pickup2,
      img_pickup3,
      img_pickup4,
      img_pickup5,
      img_pickup6,
      img_pickup7,
    ]);

    this.sprite.tint = 0xddff99;
    this.sprite.alpha = 0.7;
    this.sprite.layerName = Layer.GLOW;

    this.sprite.anchor.set(0.5);
    this.sprite.width = this.sprite.height = 0.5 + Math.sqrt(value) * 0.1;
    this.sprite.animationSpeed = 8;

    this.light = this.addChild(
      new PointLight({
        position: this.getPosition(),
        size: 2,
        color: 0xaaffaa,
      })
    );
  }

  setPosition(pos: V2d) {
    this.sprite.position.set(...pos);
    this.light.setPosition(pos);
  }

  onRender(dt: number) {
    this.t = (this.t + dt / GLOW_PERIOD) % 1;

    const textures = this.sprite.textures;
    this.sprite.texture = textures[
      Math.floor(this.t * textures.length)
    ] as Texture;

    this.light.intensity = 0.12 + 0.03 * Math.sin(this.t * 2 * Math.PI);
  }
}
