import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";

export class Tentacle extends BaseEntity implements Entity {
  segments: V2d[] = [];

  constructor() {
    super();

    for (let i = 0; i < 10; i++) {
      this.segments.push(V(i, 0));
    }
  }

  onTick() {}
}
