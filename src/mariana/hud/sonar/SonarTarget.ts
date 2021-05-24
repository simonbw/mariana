import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { V2d } from "../../../core/Vector";

export class SonarTarget extends BaseEntity implements Entity {
  tags = ["sonarFishBlip"];

  constructor(private position: () => V2d, public blipSize: number = 1) {
    super();
  }

  getPosition() {
    return this.position();
  }
}

export function getSonarTargets(game: Game) {
  return game.entities.getTagged("sonarFishBlip") as SonarTarget[];
}
