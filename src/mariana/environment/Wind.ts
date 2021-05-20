import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { lerp, stepToward } from "../../core/util/MathUtil";

const KM_PER_HOUR = 1000 / 3600; // meters to km/h
const CHANGE_RATE = 0.05; // m/s per second

const LOW_WIND = 10 * KM_PER_HOUR;
const HIGH_WIND = 50 * KM_PER_HOUR;

export class Wind extends BaseEntity implements Entity {
  id = "wind";
  wind = lerp(LOW_WIND, HIGH_WIND, Math.random() ** 3);

  targetWind = this.wind;

  constructor() {
    super();
  }

  onTick(dt: number) {
    this.wind = stepToward(this.wind, this.targetWind, dt * CHANGE_RATE);

    if (this.wind == this.targetWind) {
      this.targetWind = lerp(LOW_WIND, HIGH_WIND, Math.random() ** 2);
    }
  }
}

export function getWind(game: Game): Wind {
  return game.entities.getById("wind") as Wind;
}
