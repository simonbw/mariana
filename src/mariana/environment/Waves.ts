import { Filter, Graphics, Sprite } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { hexToVec3 } from "../../core/util/ColorUtils";
import { degToRad } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import {
  WORLD_BOTTOM,
  WORLD_LEFT_EDGE,
  WORLD_RIGHT_EDGE,
  WORLD_SIZE_METERS,
} from "../constants";
import frag_waves from "./waves.frag";
import vert_waves from "./waves.vert";
import { getWind } from "./Wind";

export const MAX_WAVE_HEIGHT = 10;
export const WATER_COLOR = 0x0099ff;

export class Waves extends BaseEntity implements Entity {
  id = "waves";

  filter: Filter;
  t = 0;
  w: number = 20 * (1000 / 3600); // 20 km/h

  constructor() {
    super();

    this.filter = new Filter(vert_waves, frag_waves, {});

    const sprite = (this.sprite = new Sprite());

    sprite.anchor.set(0.5, 0);
    sprite.width = WORLD_SIZE_METERS[0];
    sprite.height = WORLD_BOTTOM + MAX_WAVE_HEIGHT;
    sprite.x = 0;
    sprite.y = -MAX_WAVE_HEIGHT / 2;

    sprite.filters = [this.filter];

    this.sprite.layerName = Layer.WATER_OVERLAY;

    // this.addChild(new DebugWaves((x) => this.getSurfaceHeight(x)));
  }

  onTick(dt: number) {
    this.t += dt;
    this.w = getWind(this.game!).wind;
  }

  getSurfaceHeight(x: number) {
    const { t, t2, a, a2, lambda, lambda2, T, T2 } = this.getWaveStats();
    const wave1 = a * Math.sin(2 * Math.PI * (x / lambda - t / T));
    const wave2 = a2 * Math.sin(2 * Math.PI * (x / lambda2 - t2 / T2));

    return wave1 + wave2;
  }

  /** Returns true if a point is underwater */
  isUnderwater([x, y]: [number, number]): boolean {
    return y > this.getSurfaceHeight(x);
  }

  /** Returns true if a point is above water */
  isAbovewater(position: [number, number]): boolean {
    return !this.isUnderwater(position);
  }

  getSurfaceVelocity(x: number, out: V2d = V(0, 0)): V2d {
    const { t, t2, a, a2, lambda, lambda2, T, T2 } = this.getWaveStats();
    // this is the derivative of the surface height wave
    const inside1 = 2 * Math.PI * (x / lambda - t / T);
    const coefficient1 = (-2 * Math.PI * a) / T;
    const wave1 = coefficient1 * Math.cos(inside1);

    // this is the derivative of the surface height wave
    const inside2 = 2 * Math.PI * (x / lambda2 - t2 / T2);
    const coefficient2 = (-2 * Math.PI * a2) / T2;
    const wave2 = coefficient2 * Math.cos(inside2);

    return out.set(0, wave1 + wave2);
  }

  getSurfaceAngle(x: number): number {
    const h1 = this.getSurfaceHeight(x - 0.1);
    const h2 = this.getSurfaceHeight(x + 0.1);

    const slope = (h2 - h1) / 0.2; // rise / run
    return Math.atan(slope);
  }

  getWaveStats() {
    // https://en.wikipedia.org/wiki/Wind_wave#Physics_of_waves
    // https://opentextbc.ca/geology/chapter/17-1-waves/
    //
    // c = 1.25 sqrt(lambda)
    // lambda = (c/1.25) ** 2
    // lambda / T = 1.25 sqrt(lambda)
    // T = lambda / sqrt(lambda)
    // T = sqrt(lambda) / 1.25

    // wind strengths
    const w1 = this.w;
    const w2 = 0.463 * this.w;

    const t1 = this.t;
    const c1 = Math.abs(w1 / 2) + 3;
    const lambda1 = ((c1 + 1) / 1.25) ** 2;
    const T1 = Math.sqrt(lambda1) / 1.25;
    const a1 = (w1 / 10) ** 2;

    const t2 = this.t + degToRad(43); // some phase offset
    const c2 = Math.abs(w2 / 2) + 5;
    const lambda2 = ((c2 + 1) / 1.25) ** 2;
    const T2 = Math.sqrt(lambda2) / 1.25;
    const a2 = (w1 / 10) ** 2;

    return {
      t: t1,
      lambda: lambda1,
      T: T1,
      a: a1,
      t2,
      a2,
      lambda2,
      T2,
    };
  }

  getUniforms() {
    const resolution = this.filter.resolution;
    const cameraMatrix = this.game?.camera
      .getMatrix()
      .scale(resolution, resolution)
      .invert();

    return {
      ...this.getWaveStats(),
      cameraMatrix,
      resolution,
      waterColor: hexToVec3(WATER_COLOR),
    };
  }

  onRender(dt: number) {
    for (const [uniform, value] of Object.entries(this.getUniforms())) {
      this.filter.uniforms[uniform] = value;
    }
  }
}

export function getWaves(game: Game): Waves {
  return game.entities.getById("waves") as Waves;
}

// Draws waves with graphics. This is probably slow, so maybe don't do it
export class DebugWaves extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(public getHeight: (x: number) => number) {
    super();
    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_FRONTER;
  }

  onRender() {
    this.sprite.clear();

    this.sprite.beginFill(0x0000ff);
    // this.sprite.lineStyle(0.2, 0xff0000, 0.5);
    this.sprite.moveTo(WORLD_LEFT_EDGE, MAX_WAVE_HEIGHT / 2);
    const stepSize = 0.25;
    for (let x = WORLD_LEFT_EDGE; x < WORLD_RIGHT_EDGE; x += stepSize) {
      this.sprite.lineTo(x, this.getHeight(x));
    }

    this.sprite.endFill();
  }
}
