import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { stepToward } from "../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../core/util/Random";
import { V } from "../../core/Vector";
import { Bubble } from "../effects/Bubble";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { Diver } from "./Diver";

export const HARPOON_OXYGEN_COST = 5;
export const SUFFOCATION_TIME = 10; // seconds without breathing to die
export const DEPTH_BREATH_FACTOR = 0.1; // extra oxygen per meter
export const BASE_OXYGEN = 100;

// Keeps track of how much oxygen there is, and kills the player when there's not enough
export class OxygenManager extends BaseEntity implements Entity {
  currentOxygen = 100;
  suffocationPercent = 0;

  constructor(private diver: Diver) {
    super();
  }

  handlers = {
    breatheIn: () => {
      const depth = this.diver.getDepth();
      const amount = 1 + depth * DEPTH_BREATH_FACTOR;

      this.useOxygen(amount);
    },

    harpoonFired: () => {
      this.useOxygen(HARPOON_OXYGEN_COST);
    },

    diverHurt: ({ amount }: { amount: number }) => {
      this.useOxygen(amount / 2);
    },
  };

  getMaxOxygen(): number {
    const upgradeManager = getUpgradeManager(this.game!)!;

    let maxOxygen = BASE_OXYGEN;
    if (upgradeManager.hasUpgrade("air1")) {
      maxOxygen += 50;
    }
    if (upgradeManager.hasUpgrade("air2")) {
      maxOxygen += 100;
    }
    return maxOxygen;
  }

  getFillRate(): number {
    return this.getMaxOxygen() / 4;
  }

  useOxygen(amount: number) {
    this.currentOxygen -= amount;

    if (this.currentOxygen < 0) {
      this.suffocationPercent += -this.currentOxygen / 100;
      this.currentOxygen = 0;
    }
  }

  giveOxygen(amount: number) {
    this.currentOxygen = Math.min(
      this.currentOxygen + amount,
      this.getMaxOxygen()
    );
  }

  getOxygenPercent() {
    return this.currentOxygen / this.getMaxOxygen();
  }

  onTick(dt: number) {
    if (this.game?.io.keyIsDown("KeyB")) {
      this.useOxygen(0.2);
      if (rBool(0.2) && this.currentOxygen > 0) {
        this.game.addEntity(
          new Bubble(
            this.diver
              .getPosition()
              .iadd([rUniform(-0.5, 0.5), rUniform(-0.5, -0.9)]),
            V(this.diver.body.velocity).iadd([rNormal(0, 3), rNormal(0, 3)]),
            rUniform(0.2, 0.5)
          )
        );
      }
    }
    if (this.diver.isSurfaced()) {
      this.giveOxygen(dt * this.getFillRate());
    }

    if (this.currentOxygen <= 0) {
      this.suffocationPercent = stepToward(
        this.suffocationPercent,
        1,
        dt / SUFFOCATION_TIME
      );
    } else {
      this.suffocationPercent = stepToward(
        this.suffocationPercent,
        0,
        dt * 0.5
      );
    }

    if (this.suffocationPercent >= 1 && !this.diver.isDead) {
      console.log("diver suffocated");
      this.game?.dispatch({ type: "diverDied" });
    }
  }
}
