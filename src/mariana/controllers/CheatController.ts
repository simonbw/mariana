import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { getDiver } from "../diver/Diver";

/** Does cheating stuff */
export class CheatController extends BaseEntity implements Entity {
  constructor() {
    super();
  }

  onSlowTick(dt: number) {
    const diver = getDiver(this.game!)!;
    if (this.game!.io.keyIsDown("KeyF")) {
      const amount = this.game!.io.keyIsDown("ShiftLeft") ? 100 : 1;
      diver.inventory.fishSouls += amount;
    }

    if (this.game!.io.keyIsDown("KeyV")) {
      diver.air.giveOxygen(dt * diver.air.getFillRate());
    }
  }
}
