import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { MilestoneEvent } from "./milestones";
import {
  loadMoney,
  loadPrerequisites,
  resetUpgradesAndMoney,
  saveMoney,
  savePrerequisites,
} from "./persistence";
import {
  getUpgrade,
  isUpgradeId,
  PrerequisiteId,
  UpgradeId,
  UPGRADE_IDS,
} from "./upgrades";

// This keeps track of all our upgrades and money and stuff
export class UpgradeManager extends BaseEntity implements Entity {
  persistenceLevel = 1;
  id = "upgradeManager";

  money: number = 0;
  private prerequisites: Set<PrerequisiteId>;

  constructor() {
    super();

    this.money = loadMoney();
    this.prerequisites = loadPrerequisites();
  }

  hasUpgrade(upgradeId: UpgradeId): boolean {
    return this.prerequisites.has(upgradeId);
  }

  hasPrerequisite(prerequisiteId: PrerequisiteId): boolean {
    return this.prerequisites.has(prerequisiteId);
  }

  canBuyUpgrade(upgradeId: UpgradeId): boolean {
    return (
      !this.hasUpgrade(upgradeId) &&
      this.canAffordUpgrade(upgradeId) &&
      this.hasPrerequisites(upgradeId)
    );
  }

  canAffordUpgrade(upgradeId: UpgradeId): boolean {
    return this.money >= getUpgrade(upgradeId).cost;
  }

  hasPrerequisites(upgradeId: UpgradeId): boolean {
    for (const prerequisite of getUpgrade(upgradeId).prerequisites) {
      if (!this.hasPrerequisite(prerequisite)) {
        return false;
      }
    }

    return true;
  }

  buyUpgrade(upgradeId: UpgradeId) {
    if (!this.canBuyUpgrade(upgradeId)) {
      throw new Error(`Cannot buy upgrade: ${upgradeId}`);
    }

    const upgrade = getUpgrade(upgradeId);

    this.money -= upgrade.cost;
    this.addPrerequisite(upgradeId);
    saveMoney(this.money);

    this.game?.dispatch({ type: "upgradeBought", upgradeId });
  }

  giveMoney(amount: number) {
    this.money += amount;
    saveMoney(this.money);
  }

  addPrerequisite(prerequisiteId: PrerequisiteId) {
    this.prerequisites.add(prerequisiteId);
    savePrerequisites(this.prerequisites);
  }

  getAvailableUpgrades(): UpgradeId[] {
    return UPGRADE_IDS.filter(
      (u) => !this.hasUpgrade(u) && this.hasPrerequisites(u)
    );
  }

  getPurchasedUpgrades(): UpgradeId[] {
    return [...this.prerequisites].filter(isUpgradeId);
  }

  handlers = {
    depositSouls: (event: { amount: number }) => {
      this.giveMoney(event.amount);
    },

    resetUpgrades: () => {
      resetUpgradesAndMoney();
    },

    milestoneReached: ({ id }: MilestoneEvent) => {
      this.addPrerequisite(id);
    },
  };
}

export function getUpgradeManager(game: Game): UpgradeManager {
  return game.entities!.getById("upgradeManager") as UpgradeManager;
}
