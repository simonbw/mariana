import { vec2 } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { getDiver } from "../diver/Diver";

export class SoulDepot extends BaseEntity implements Entity {
  tags = ["soulDepot"];
  enabled: boolean = true;

  constructor(private range: number = 5) {
    super();
  }

  setPosition(pos: V2d) {
    this._position.set(pos);
  }

  onSlowTick() {
    if (this.enabled) {
      const diver = getDiver(this.game!);
      if (
        diver &&
        vec2.distance(diver.getPosition(), this._position) < this.range
      ) {
        const inventory = diver?.inventory;
        inventory.transferSouls(this);
      }
    }
  }
}
