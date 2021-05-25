import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { V2d } from "../../../core/Vector";

interface Options {
  blipSize: number;
  color: number;
}

export class SonarMarker extends BaseEntity implements Entity {
  tags = ["sonarMarker"];

  blipSize: number;
  color: number;

  constructor(
    private position: () => V2d,
    { blipSize = 1, color = 0x00ff00 }: Partial<Options> = {}
  ) {
    super();
    this.blipSize = blipSize;
    this.color = color;
  }

  getPosition() {
    return this.position();
  }
}

export function getSonarMarkers(game: Game) {
  return game.entities.getTagged("sonarMarker") as SonarMarker[];
}
