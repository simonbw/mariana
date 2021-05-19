import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import AimSpring from "../../../core/physics/AimSpring";
import { BaseFish } from "../BaseFish";

// TODO: Redo this without springs. Just step have a maximum turning speed or something
export class FishAim extends BaseEntity implements Entity {
  aimSpring: AimSpring;
  enabled: boolean = true;

  constructor(
    public fish: BaseFish,
    public stiffness: number,
    public damping: number
  ) {
    super();

    this.aimSpring = new AimSpring(this.fish.body);
    this.aimSpring.stiffness = stiffness;
    this.aimSpring.damping = damping;
    this.springs = [this.aimSpring];
  }

  onTick() {
    if (!this.enabled || this.fish.isSurfaced()) {
      this.aimSpring.stiffness = 0;
      this.aimSpring.damping = 0;
    } else {
      this.aimSpring.stiffness = this.stiffness;
      this.aimSpring.damping = this.damping;
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  setAngle(angle: number) {
    this.aimSpring.restAngle = angle;
  }
}
