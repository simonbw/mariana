import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { V2d } from "../../../core/Vector";

interface Options {
  blipSize: number;
  color: number;
}

/** A thing a ping can hit */
export class SonarTarget extends BaseEntity implements Entity {
  tags = ["sonarTarget"];
  blipSize: number;
  color: number;

  constructor(
    private position: () => V2d,
    { blipSize = 1, color = 0xff0000 }: Partial<Options> = {}
  ) {
    super();
    this.blipSize = blipSize;
    this.color = color;
  }

  getPosition() {
    return this.position();
  }
}

export function getSonarTargets(game: Game) {
  return game.entities.getTagged("sonarTarget") as SonarTarget[];
}
