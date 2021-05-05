import { SCALE_MODES, Sprite, Text } from "pixi.js";
import img_diveWatchBack from "../../../resources/images/ui/dive-watch-back.png";
import img_diveWatchNeedle from "../../../resources/images/ui/dive-watch-needle.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { clamp, clampUp, degToRad, lerp } from "../../core/util/MathUtil";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { WORLD_BOTTOM } from "../constants";
import { Diver } from "../diver/Diver";
import { FONT_ALTERNATE, FONT_BODY } from "../fonts";

const MIN_AIR_ANGLE = degToRad(-135);
const MAX_AIR_ANGLE = degToRad(135);
const MIN_DEPTH_ANGLE = degToRad(-150);
const MAX_DEPTH_ANGLE = degToRad(150);

const NEEDLE_SPEED = 2;

const SCALE = 0.4;
export const DIVE_WATCH_WIDTH = 512 * SCALE;
export const DIVE_WATCH_HEIGHT = 512 * SCALE;

export class DiveWatch extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  airNeedleSprite: Sprite;
  depthNeedleSprite: Sprite;
  faceSprite: Sprite;
  depthText: Text;

  constructor(private diver: Diver) {
    super();

    const sprite = (this.sprite = new Sprite());
    sprite.anchor.set(1);
    sprite.scale.set(SCALE);

    this.faceSprite = Sprite.from(img_diveWatchBack, {
      scaleMode: SCALE_MODES.LINEAR,
    });
    this.airNeedleSprite = Sprite.from(img_diveWatchNeedle, {
      scaleMode: SCALE_MODES.LINEAR,
    });
    this.depthNeedleSprite = Sprite.from(img_diveWatchNeedle, {
      scaleMode: SCALE_MODES.LINEAR,
    });

    this.airNeedleSprite.anchor.set(0.5, 1);
    this.depthNeedleSprite.anchor.set(0.5, 1);

    this.airNeedleSprite.position.set(256, 166);
    this.depthNeedleSprite.position.set(256, 336);

    this.depthNeedleSprite.rotation = MIN_DEPTH_ANGLE;
    this.airNeedleSprite.rotation = MIN_AIR_ANGLE;

    this.depthText = new Text("", { fontFamily: FONT_ALTERNATE, fontSize: 32 });
    this.depthText.anchor.set(0.5, 0.5);
    this.depthText.position.set(256, 310);

    sprite.addChild(this.faceSprite);
    sprite.addChild(this.depthText);
    sprite.addChild(this.depthNeedleSprite);
    sprite.addChild(this.airNeedleSprite);

    this.sprite.layerName = Layer.HUD;
  }

  onResize([width, height]: V2d) {
    this.sprite!.x = width - DIVE_WATCH_WIDTH * 0.9;
    this.sprite!.y = height - DIVE_WATCH_HEIGHT;
  }

  onRender(dt: number) {
    const depth = this.diver.getDepth();
    const depthPercent = depth / WORLD_BOTTOM;
    const airPercent = this.diver.air.getOxygenPercent();

    const airTargetAngle = lerp(MIN_AIR_ANGLE, MAX_AIR_ANGLE, airPercent);

    this.depthText.text = String(Math.round(clampUp(depth)));

    const depthTargetAngle = lerp(
      MIN_DEPTH_ANGLE,
      MAX_DEPTH_ANGLE,
      depthPercent
    );

    this.airNeedleSprite.rotation = lerp(
      this.airNeedleSprite.rotation,
      airTargetAngle,
      clamp(dt * NEEDLE_SPEED)
    );

    this.depthNeedleSprite.rotation = lerp(
      this.depthNeedleSprite.rotation,
      depthTargetAngle,
      clamp(dt * NEEDLE_SPEED)
    );
  }
}
