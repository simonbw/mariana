export const MILESTONES = ["100m", "200m", "300m"] as const;

export type MilestoneId = typeof MILESTONES[number];

export function isMilestoneId(s: string): s is MilestoneId {
  return (MILESTONES as readonly string[]).indexOf(s) >= 0;
}

export interface MilestoneEvent {
  type: "milestoneReached";
  id: MilestoneId;
}

export function milestoneEvent(id: MilestoneId): MilestoneEvent {
  return {
    type: "milestoneReached",
    id: id,
  };
}
