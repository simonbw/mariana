import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { stepToward } from "../../core/util/MathUtil";
import { Diver } from "./Diver";

export class DiverHealth extends BaseEntity implements Entity {
  hp: number = 100;
  maxHp: number = 100;

  constructor(public diver: Diver) {
    super();
  }

  damage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.game?.dispatch({ type: "diverDied", cause: "hp" });
    }
  }

  onSlowTick(dt: number) {
    if (this.diver.isSurfaced()) {
      this.hp = stepToward(this.hp, this.maxHp, dt * 100);
    }
  }

  handlers = {
    diverHurt: ({ amount }: DiverHurtEvent) => {
      this.damage(amount);
    },
  };
}

export interface DiverHurtEvent {
  type: "diverHurt";
  amount: number;
}

export function diverHurtEvent(amount: number): DiverHurtEvent {
  return {
    type: "diverHurt",
    amount,
  };
}
