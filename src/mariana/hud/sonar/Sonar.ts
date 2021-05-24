import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { getDiver } from "../../diver/Diver";
import { SonarPing } from "./SonarPing";

export const TIME_BETWEEN_PINGS = 1.5; // seconds
const SCREEN_SIZE = 160; // pixels
const DISPLAY_RADIUS = 50; // meters

export class Sonar extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  translationContainer: Sprite;

  constructor() {
    super();

    this.sprite = new Sprite();

    const background = new Graphics();
    background.lineStyle({ width: 2.0, color: 0x666666 });
    background.beginFill(0x111111);
    background.drawCircle(0, 0, DISPLAY_RADIUS);
    background.endFill();
    this.sprite.addChild(background);

    const mask = new Graphics();
    mask.beginFill(0x000000);
    mask.drawCircle(0, 0, DISPLAY_RADIUS);
    mask.endFill();
    this.sprite.addChild(mask);
    this.sprite.mask = mask;

    this.translationContainer = new Sprite();
    this.sprite.addChild(this.translationContainer);

    const diverMarker = new Graphics();
    diverMarker.beginFill(0xffff00);
    diverMarker.drawCircle(0, 0, 1);
    diverMarker.endFill();
    this.sprite.addChild(diverMarker);

    const boatMarker = new Graphics();
    boatMarker.beginFill(0x0000ff);
    boatMarker.drawCircle(0, 0, 2);
    boatMarker.endFill();
    this.translationContainer.addChild(boatMarker);

    const surfaceMarker = new Graphics();
    surfaceMarker.lineStyle({ width: 0.3, color: 0x0055ff });
    surfaceMarker.moveTo(-100, 0);
    surfaceMarker.lineTo(100, 0);
    this.translationContainer.addChild(surfaceMarker);

    // TODO: DiveBell marker

    this.sprite.alpha = 0.9;
    this.sprite.layerName = Layer.HUD;
    this.sprite.scale.set(SCREEN_SIZE / (2 * DISPLAY_RADIUS));
  }

  async onAdd() {
    while (true) {
      await this.wait(TIME_BETWEEN_PINGS);
      await this.ping();
    }
  }

  onResize([width, height]: V2d) {
    const d = SCREEN_SIZE / 2 + 20;
    this.sprite!.x = d;
    this.sprite!.y = height - d;
  }

  async ping() {
    const position = getDiver(this.game!)!.getPosition();
    const ping = this.addChild(new SonarPing(position));
    this.translationContainer.addChild(ping.sonarSprite);
  }

  onRender() {
    const camera = this.game!.camera;
    this.translationContainer.position.set(-camera.x, -camera.y);
  }
}

export interface PingParticle {
  position: V2d;
  velocity: V2d;
  stopped: boolean;
}

export interface ReachedTarget {
  position: V2d;
  blipSize: number;
}
