import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { lerp } from "../../core/util/MathUtil";
import { rBool, rUniform } from "../../core/util/Random";
import { V } from "../../core/Vector";
import { WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE } from "../constants";
import { Cloud } from "./Cloud";
import { Daylight } from "./Daylight";
import { Sun } from "./Sun";

const SECONDS_PER_HOUR = 1;
const NUM_CLOUDS = 100;

export const SUNRISE = 6;
export const SUNSET = 18;

export class Sky extends BaseEntity implements Entity {
  id = "sky";
  hour: number = SUNRISE;

  constructor() {
    super();

    this.addChild(new Sun(() => this.hour));
    this.addChild(new Daylight(() => this.hour));

    for (let i = 0; i < NUM_CLOUDS; i++) {
      const x = rUniform(WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE);
      const y = rUniform(-8, -12);
      const front = rBool();
      this.addChild(new Cloud(V(x, y), front));
    }
  }

  onTick(dt: number) {
    this.hour += dt / SECONDS_PER_HOUR;
    this.hour %= 24;
  }
}

export function isNight(game: Game): boolean {
  const hour = (game.entities.getById("sky") as Sky).hour;
  return hour < SUNRISE || hour > SUNSET;
}

export function getWind(game: Game): number {
  return 20 * (1000 / 3600); // 20 km/h
}
