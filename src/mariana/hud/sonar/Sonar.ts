import { NoiseFilter } from "@pixi/filter-noise";
import { BlurFilter } from "@pixi/filter-blur";
import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { getDiver } from "../../diver/Diver";
import { SonarPing } from "./SonarPing";
import { getSonarMarkers } from "./SonarMarker";
import { getWaves } from "../../environment/Waves";

export const TIME_BETWEEN_PINGS = 1.5; // seconds
const SCREEN_SIZE = 160; // pixels
const DISPLAY_RADIUS = 40; // meters

export class Sonar extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  translationContainer: Sprite;
  screen: Sprite;
  markers: Graphics;
  surface: Graphics;

  constructor() {
    super();

    this.sprite = new Sprite();

    const mask = new Graphics();
    mask.beginFill(0x000000);
    mask.drawCircle(0, 0, DISPLAY_RADIUS);
    mask.endFill();
    this.sprite.addChild(mask);

    this.screen = new Sprite();
    this.sprite.addChild(this.screen);
    // this.screen.filters = [];
    this.screen.mask = mask;

    const background = new Graphics();
    background.beginFill(0x0a0a0a);
    background.drawCircle(0, 0, DISPLAY_RADIUS);
    background.endFill();
    this.screen.addChild(background);

    this.translationContainer = new Sprite();
    this.screen.addChild(this.translationContainer);

    const diverMarker = new Graphics();
    diverMarker.beginFill(0xffff00);
    diverMarker.drawCircle(0, 0, 1);
    diverMarker.endFill();
    this.sprite.addChild(diverMarker);

    this.markers = new Graphics();
    this.translationContainer.addChild(this.markers);

    this.surface = new Graphics();
    this.surface.lineStyle({ width: 0.3, color: 0x0055ff });
    this.surface.moveTo(-1000, 0);
    this.surface.lineTo(1000, 0);
    this.translationContainer.addChild(this.surface);

    const rim = new Graphics();
    rim.lineStyle({ width: 2.0, color: 0x666666 });
    rim.drawCircle(0, 0, DISPLAY_RADIUS);
    this.sprite.addChild(rim);

    // TODO: DiveBell marker

    this.sprite.alpha = 1.0;
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

  onRender(dt: number) {
    const camera = this.game!.camera;
    this.translationContainer.position.set(-camera.x, -camera.y);

    this.markers.clear();
    const markers = getSonarMarkers(this.game!)!;
    for (const marker of markers) {
      this.markers.beginFill(marker.color);
      const [x, y] = marker.getPosition();
      this.markers.drawCircle(x, y, marker.blipSize);
      this.markers.endFill();
    }

    const waves = getWaves(this.game!);
    const minX = camera.x - DISPLAY_RADIUS;
    const maxX = camera.x + DISPLAY_RADIUS;
    this.surface.clear();
    this.surface.lineStyle({ width: 0.4, color: 0x0033ff });
    this.surface.moveTo(minX - 1, 0);
    for (let x = minX; x <= maxX; x += 2) {
      this.surface.lineTo(x, waves.getSurfaceHeight(x));
    }
  }
}

export interface PingParticle {
  position: V2d;
  velocity: V2d;
  stopped: boolean;
}
