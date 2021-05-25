import { SCALE_MODES, Sprite, Text } from "pixi.js";
import img_boat from "../../../resources/images/environment/boat.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { clamp, lerp, lerpOrSnap } from "../../core/util/MathUtil";
import { FONT_HEADING } from "../config/fonts";
import { Layer } from "../config/layers";
import { getDiver } from "../diver/Diver";
import { getWaves } from "../environment/Waves";
import { PointLight } from "../lighting/PointLight";
import { Boat } from "./Boat";

const BOAT_WIDTH = 8; // meters
const TOOLTIP_SPEED = 5;

export class BoatSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  light: any;
  tooltip: Text;

  constructor(private boat: Boat) {
    super();

    this.sprite = Sprite.from(img_boat, { scaleMode: SCALE_MODES.NEAREST });
    this.sprite.layerName = Layer.BOAT;
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.anchor.set(0.5, 0.55);
    this.sprite.scale.set(BOAT_WIDTH / this.sprite.texture.width);

    this.tooltip = new Text("Press E To Shop", {
      fontSize: 24,
      fill: "black",
      fontFamily: FONT_HEADING,
    });
    this.tooltip.position.set(0, 10);
    this.tooltip.anchor.set(0.5, 0);
    this.tooltip.alpha = 0;
    this.tooltip.texture.baseTexture.scaleMode = SCALE_MODES.LINEAR;

    this.sprite.addChild(this.tooltip);

    this.light = this.addChild(
      new PointLight({ size: 20, intensity: 0.2, color: 0xffeedd })
    );
  }

  getRotation(): number {
    const waves = getWaves(this.game!);

    const h1 = waves.getSurfaceHeight(this.boat.x - 0.1);
    const h2 = waves.getSurfaceHeight(this.boat.x + 0.1);

    const slope = (h2 - h1) / 0.2; // rise / run
    return Math.atan(slope);
  }

  onRender(dt: number) {
    const usingGamepad = this.game!.io.usingGamepad;
    if (getDiver(this.game!)?.onBoat) {
      this.tooltip.text = `Press ${usingGamepad ? "A" : "SPACE"} To Dive`;
    } else {
      this.tooltip.text = `Press ${usingGamepad ? "Y" : "E"} To Shop`;
    }

    this.sprite.position.set(...this.boat.getPosition());

    this.tooltip.alpha = lerp(
      this.tooltip.alpha,
      this.boat.diverIsNear() ? 1 : 0,
      dt * TOOLTIP_SPEED
    );

    this.sprite.rotation = lerp(
      this.sprite.rotation,
      this.getRotation(),
      clamp(dt * 2.5)
    );

    this.light.setPosition(this.boat.getPosition());
  }
}
