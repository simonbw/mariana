import { DiveBellUpgradeId, DIVE_BELL_UPGRADES } from "./diveBellUpgrades";
import { HarpoonUpgradeId, HARPOON_UPGRADES } from "./harpoonUpgrades";
import { MilestoneId } from "./milestones";

/** */
export interface Upgrade {
  name: string;
  description: string;
  cost: number;
  prerequisites: PrerequisiteId[];
  thumbnailUrl?: string;
}

export type UpgradeId =
  | SystemUpgradeId
  | MovementUpgradeId
  | AirUpgradeId
  | DiveBellUpgradeId
  | HarpoonUpgradeId;

type SystemUpgradeId = "soulMagnet" | "flashlight";
type AirUpgradeId = "air1" | "air2" | "nitrox" | "rebreather";
type MovementUpgradeId = "flippers1" | "flippers2" | "weightBelt" | "BCD";

export type PrerequisiteId = UpgradeId | MilestoneId;

/** All the upgrades */
const UPGRADES: Record<UpgradeId, Upgrade> = {
  flippers1: {
    name: "Flippers",
    description: "Swim faster",
    cost: 100,
    prerequisites: [],
  },
  flippers2: {
    name: "Advanced Flippers",
    description: "Swim even faster",
    cost: 300,
    prerequisites: ["flippers1"],
  },
  weightBelt: {
    name: "Weight Belt",
    description: "Sink faster",
    cost: 50,
    prerequisites: [],
  },
  BCD: {
    name: "BCD",
    description: "Swim up faster",
    cost: 250,
    prerequisites: ["weightBelt"],
  },
  air1: {
    name: "Air Tank",
    description: "Stay underwater for longer",
    cost: 150,
    prerequisites: [],
  },
  air2: {
    name: "Bigger Air Tank",
    description: "Holds more air",
    cost: 300,
    prerequisites: ["air1"],
  },
  nitrox: {
    name: "Nitrox",
    description: "Don't use more air as you get deeper",
    cost: 300,
    prerequisites: ["air1"],
  },
  rebreather: {
    name: "Rebreather",
    description: "Blow fewer bubbles",
    cost: 800,
    prerequisites: ["air2"],
  },
  soulMagnet: {
    name: "Soul Magnet",
    description: "Collect fish souls from farther away",
    cost: 200,
    prerequisites: [],
  },
  flashlight: {
    name: "Flashlight",
    description: "Allows you to see in the dark",
    cost: 100,
    prerequisites: [],
  },

  ...HARPOON_UPGRADES,
  ...DIVE_BELL_UPGRADES,
};

export const UPGRADE_IDS: UpgradeId[] = Object.keys(UPGRADES) as UpgradeId[];

/** Returns the upgrade with the given ID */
export function getUpgradeById(id: UpgradeId): Upgrade {
  return UPGRADES[id];
}

export function isUpgradeId(s: string): s is UpgradeId {
  return s in UPGRADES;
}
