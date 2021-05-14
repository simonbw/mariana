import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { invLerp } from "../../core/util/MathUtil";

/** Real world seconds per in-game hour */
const SECONDS_PER_HOUR = 1;

export const SUNRISE_START = 4.3;
export const SUNRISE_MID = 6.3;
export const SUNRISE_END = 7.5;
export const SUNSET_START = 17.0;
export const SUNSET_MID = 19.0;
export const SUNSET_END = 21.0;

export const TIME_UNIFORMS = {
  sunriseStart: SUNRISE_START,
  sunriseMid: SUNRISE_MID,
  sunriseEnd: SUNRISE_END,
  sunsetStart: SUNSET_START,
  sunsetMid: SUNSET_MID,
  sunsetEnd: SUNSET_END,
};

export class TimeOfDay extends BaseEntity implements Entity {
  id = "timeOfDay";

  hour: number = 0.0;

  constructor() {
    super();
  }

  /** Returns basically how dark it currently is */
  getNightPercent() {
    const hour = this.hour;
    if (hour < SUNRISE_START) {
      return 1.0;
    } else if (hour < SUNRISE_END) {
      return invLerp(SUNRISE_END, SUNRISE_START, hour);
    } else if (hour < SUNSET_START) {
      return 0.0;
    } else if (hour < SUNSET_END) {
      return invLerp(SUNSET_START, SUNSET_END, hour);
    } else {
      return 1.0;
    }
  }

  onTick(dt: number) {
    this.hour += dt / SECONDS_PER_HOUR;
    this.hour %= 24;
  }
}

export function getTimeOfDay(game: Game): TimeOfDay {
  return game.entities.getById("timeOfDay") as TimeOfDay;
}
