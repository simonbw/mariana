import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { getDiver } from "../diver/Diver";
import { milestoneEvent, MilestoneId } from "./milestones";

/** Listens for milestones to happen */
export class MilestoneManager extends BaseEntity implements Entity {
  milestonesMet = new Set<MilestoneId>();

  constructor() {
    super();
  }

  onSlowTick() {
    const diver = getDiver(this.game!);
    const depth = diver?.getDepth() ?? 0;

    if (depth > 100) {
      this.meetMilestone("100m");
    }
    if (depth > 200) {
      this.meetMilestone("200m");
    }
    if (depth > 300) {
      this.meetMilestone("300m");
    }
  }

  meetMilestone(milestoneId: MilestoneId) {
    if (!this.milestonesMet.has(milestoneId)) {
      this.milestonesMet.add(milestoneId);
      this.game!.dispatch(milestoneEvent(milestoneId));
    }
  }
}
