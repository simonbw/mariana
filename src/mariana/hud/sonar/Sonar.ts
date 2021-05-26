import { Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { clamp } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { getDiver } from "../../diver/Diver";
import { getWaves } from "../../environment/Waves";
import { getSonarMarkers } from "./SonarMarker";
import { SonarPing } from "./SonarPing";

export const TIME_BETWEEN_PINGS = 1.0; // seconds
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
    background.beginFill(0x0d0d0d);
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

    const rimWidth = 2.0;
    const rim = new Graphics();
    rim.lineStyle({ width: rimWidth, color: 0x666666 });
    rim.drawCircle(0, 0, DISPLAY_RADIUS + rimWidth * 0.49);
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

  private _markerDisplacement = V(0, 0);
  onRender(dt: number) {
    const camera = this.game!.camera;
    this.translationContainer.position.set(-camera.x, -camera.y);

    this.markers.clear();
    const markers = getSonarMarkers(this.game!)!;
    const d = this._markerDisplacement;
    for (const marker of markers) {
      d.set(marker.getPosition()).isub(camera.position);
      d.magnitude = clamp(d.magnitude, 0, DISPLAY_RADIUS);
      d.iadd(camera.position);
      const [x, y] = d;
      this.markers.beginFill(marker.color);
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
