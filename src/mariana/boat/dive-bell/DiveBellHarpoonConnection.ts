import { LockConstraint } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { Harpoon } from "../../diver/harpoon/Harpoon";
import { DiveBell } from "./DiveBell";

/** Joins the bell to the harpoon */
export default class DiveBellHarpoonConnection
  extends BaseEntity
  implements Entity {
  constructor(bell: DiveBell, private harpoon: Harpoon) {
    super();

    this.constraints = [new LockConstraint(bell.body, harpoon.body)];
  }

  onTick() {
    const gun = this.harpoon.harpoonGun;
    if (gun.tether?.retracting && gun.tether.retractPercent >= 1.0) {
      this.destroy();
    } else {
      // ?
    }
  }
}
