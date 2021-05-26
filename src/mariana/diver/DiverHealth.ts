import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { stepToward } from "../../core/util/MathUtil";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { Diver } from "./Diver";

const COOLDOWN_TIME = 5.0; // seconds
const REGEN_SPEED = 10.0; // hp / sec
export class DiverHealth extends BaseEntity implements Entity {
  hp: number = 100;
  regenCooldown = 0;

  constructor(public diver: Diver) {
    super();
  }

  get maxHp(): number {
    const upgradeManager = getUpgradeManager(this.game!);
    upgradeManager.hasUpgrade;
    return 100.0;
  }

  damage(amount: number) {
    this.regenCooldown = Math.max(this.regenCooldown, COOLDOWN_TIME);
    this.hp -= amount;
    if (this.hp <= 0) {
      this.game?.dispatch({ type: "diverDied", cause: "hp" });
    }
  }

  onSlowTick(dt: number) {
    if (this.diver.isSurfaced()) {
      this.regenCooldown = 0;
      this.hp = stepToward(this.hp, this.maxHp, dt * 100);
    }

    if (this.regenCooldown > 0) {
      this.regenCooldown -= Math.min(dt, this.regenCooldown);
    } else if (this.hp < this.maxHp * 0.5) {
      this.hp = Math.min(this.hp + dt * REGEN_SPEED, this.maxHp * 0.5);
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
