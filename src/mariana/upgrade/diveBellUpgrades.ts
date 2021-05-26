import { Upgrade } from "./upgrades";

export type DiveBellUpgradeId =
  | "diveBell"
  | "diveBellDepth1"
  | "diveBellDepth2";

export const DIVE_BELL_UPGRADES: Record<DiveBellUpgradeId, Upgrade> = {
  diveBell: {
    name: "Dive Bell",
    description: "Provides air under water",
    cost: 100,
    prerequisites: ["100m"],
  },
  diveBellDepth1: {
    name: "Reinforced Dive Bell",
    description: "Allows dive bell to go down to 200m",
    cost: 500,
    prerequisites: ["diveBell"],
  },
  diveBellDepth2: {
    name: "Double-Reinforced Dive Bell",
    description: "Allows dive bell to go down to 800m",
    cost: 2000,
    prerequisites: ["diveBellDepth1"],
  },
};
