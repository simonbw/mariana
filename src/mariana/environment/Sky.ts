import { Sprite } from "@pixi/sprite";
import { Filter } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { rBool, rUniform } from "../../core/util/Random";
import { V } from "../../core/Vector";
import { Layer } from "../config/layers";
import {
  WORLD_LEFT_EDGE,
  WORLD_RIGHT_EDGE,
  WORLD_SIZE_METERS,
} from "../constants";
import { Cloud } from "./Cloud";
import { Daylight } from "./Daylight";
import frag_sky from "./sky.frag";
import { Sun } from "./Sun";

const SECONDS_PER_HOUR = 1;
const NUM_CLOUDS = 0;

export const SUNRISE = 6;
export const SUNSET = 18;

export class Sky extends BaseEntity implements Entity {
  id = "sky";
  hour: number = 3;
  filter: Filter;

  constructor() {
    super();

    const sprite = (this.sprite = new Sprite());
    sprite.anchor.set(0.5, 1.0);
    sprite.y = 10;
    sprite.width = WORLD_SIZE_METERS[0];
    sprite.height = 100;

    this.filter = new Filter(undefined, frag_sky);
    sprite.filters = [this.filter];

    this.sprite.layerName = Layer.BACKGROUND;

    for (let i = 0; i < NUM_CLOUDS; i++) {
      const x = rUniform(WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE);
      const y = rUniform(-8, -12);
      const front = rBool();
      this.addChild(new Cloud(V(x, y), front));
    }

    this.addChild(new Sun(() => this.hour));
    this.addChild(new Daylight(() => this.hour));
  }

  onTick(dt: number) {
    this.hour += dt / SECONDS_PER_HOUR;
    this.hour %= 24;
  }

  getUniforms() {
    const resolution = this.filter.resolution;
    const cameraMatrix = this.game?.camera
      .getMatrix()
      .scale(resolution, resolution)
      .invert();

    return {
      cameraMatrix,
      resolution,
      skyHeight: 30,
      hour: this.hour,
    };
  }

  onRender() {
    for (const [uniform, value] of Object.entries(this.getUniforms())) {
      this.filter.uniforms[uniform] = value;
    }
  }
}

export function isNight(game: Game): boolean {
  const hour = (game.entities.getById("sky") as Sky).hour;
  return hour < SUNRISE || hour > SUNSET;
}

export function getWind(game: Game): number {
  return 20 * (1000 / 3600); // 20 km/h
}

export function getTimeOfDay(game: Game): number {
  const sky = game.entities.getById("sky") as Sky;
  return sky.hour;
}
