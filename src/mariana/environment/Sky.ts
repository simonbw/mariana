import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { lerp } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE } from "../constants";
import { Cloud } from "./Cloud";
import { Sun } from "./Sun";

const SECONDS_PER_DAY = 60;
const NUM_CLOUDS = 30;

export class Sky extends BaseEntity implements Entity {
  constructor() {
    super();

    this.addChild(new Sun());

    for (let i = 0; i < NUM_CLOUDS; i++) {
      this.addChild(
        new Cloud(
          V(lerp(WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE, i / NUM_CLOUDS), -10)
        )
      );
      this.addChild(
        new Cloud(
          V(lerp(WORLD_LEFT_EDGE + 3, WORLD_RIGHT_EDGE, i / NUM_CLOUDS), -10),
          false
        )
      );
    }
  }
}

export function getTimeOfDay(game: Game): number {
  return game!.elapsedTime / SECONDS_PER_DAY;
}

export function getWind(game: Game): number {
  return 20 * (1000 / 3600); // 20 km/h
}
