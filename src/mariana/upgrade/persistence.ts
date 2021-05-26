import { isMilestoneId } from "./milestones";
import { isUpgradeId, PrerequisiteId, UpgradeId } from "./upgrades";

// Keys for localStorage. Be careful, changing these values will wipe out saved data.
const MONEY_KEY = "money";
const UPGRADES_KEY = "prerequisites";

export function loadMoney(): number {
  const storedPoints = parseInt(window.localStorage.getItem(MONEY_KEY) ?? "");

  if (isNaN(storedPoints)) {
    return 0;
  } else {
    return storedPoints;
  }
}

export function saveMoney(money: number) {
  window.localStorage.setItem(MONEY_KEY, String(money));
}

export function loadPrerequisites(): Set<PrerequisiteId> {
  const rawValue = window.localStorage.getItem(UPGRADES_KEY) ?? "";

  const prerequisites = new Set<PrerequisiteId>();

  for (const maybePrereqId of rawValue.split(",")) {
    if (isUpgradeId(maybePrereqId) || isMilestoneId(maybePrereqId)) {
      prerequisites.add(maybePrereqId);
    } else {
      console.log(`unknown prerequisite: ${maybePrereqId}`);
    }
  }
  return prerequisites;
}

export function savePrerequisites(prerequisites: Iterable<PrerequisiteId>) {
  const value = [...prerequisites].join(",");
  window.localStorage.setItem(UPGRADES_KEY, value);
}

export function resetUpgradesAndMoney() {
  window.localStorage.removeItem(UPGRADES_KEY);
  window.localStorage.removeItem(MONEY_KEY);
}
