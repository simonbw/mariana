import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";
import { getDiver } from "../diver/Diver";

/** A thing that can be interacted with */
export class Interactible extends BaseEntity implements Entity {
  constructor(position: V2d, public range: number = 3) {
    super();
  }

  diverIsPresent() {
    const diver = getDiver(this.game);
    if (!diver) {
      return false;
    }

    // const xDistance = Math.abs(diver.getPosition().x - this.x);
    // const yDistance = diver.getDepth();
    // return yDistance < this.range && xDistance < this.range;
  }

  setPosition(position: V2d) {}
}
