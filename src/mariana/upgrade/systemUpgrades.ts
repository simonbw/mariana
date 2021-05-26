import { Upgrade } from "./upgrades";

export type HarpoonUpgradeId =
  | "autoRetractor"
  | "turboRetractor"
  | "doubleEndedPoon";

export const HARPOON_UPGRADES: Record<HarpoonUpgradeId, Upgrade> = {
  autoRetractor: {
    name: "Auto Retractor",
    description: "Retract your harpoon faster",
    cost: 100,
    prerequisites: [],
  },
  turboRetractor: {
    name: "Turbo Retractor",
    description: "Retract your harpoon super faster",
    cost: 1000,
    prerequisites: ["autoRetractor"],
  },
  doubleEndedPoon: {
    name: "Double Ended 'Poon",
    description: "Sharpen your harpoon at both ends",
    cost: 300,
    prerequisites: ["autoRetractor"],
  },
};
