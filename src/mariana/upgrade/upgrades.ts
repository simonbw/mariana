import { MilestoneId } from "./milestones";

/** */
interface Upgrade {
  name: string;
  description: string;
  cost: number;
  prerequisites: PrerequisiteId[];
  thumbnailUrl?: string;
}

export type UpgradeId =
  | "flippers1"
  | "flippers2"
  | "weightBelt"
  | "BCD"
  | "air1"
  | "air2"
  | "nitrox"
  | "rebreather"
  | "autoRetractor"
  | "turboRetractor"
  | "doubleEndedPoon"
  | "soulMagnet"
  | "diveBell"
  | "diveBellDepth1"
  | "diveBellDepth2"
  | "flashlight";

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
  soulMagnet: {
    name: "Soul Magnet",
    description: "Collect fish souls from farther away",
    cost: 200,
    prerequisites: [],
  },
  doubleEndedPoon: {
    name: "Double Ended 'Poon",
    description: "Sharpen your harpoon at both ends",
    cost: 300,
    prerequisites: ["autoRetractor"],
  },
  diveBell: {
    name: "Dive Bell",
    description: "Provides air under water",
    cost: 100,
    prerequisites: ["100m"],
  },
  flashlight: {
    name: "Flashlight",
    description: "Allows you to see in the dark",
    cost: 100,
    prerequisites: [],
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

export const UPGRADE_IDS: UpgradeId[] = Object.keys(UPGRADES) as UpgradeId[];

/** Returns the upgrade with the given ID */
export function getUpgrade(id: UpgradeId): Upgrade {
  return UPGRADES[id];
}

export function isUpgradeId(s: string): s is UpgradeId {
  return s in UPGRADES;
}
