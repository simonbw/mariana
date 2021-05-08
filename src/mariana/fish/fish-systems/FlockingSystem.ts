import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { clampUp } from "../../../core/util/MathUtil";
import { V } from "../../../core/Vector";
import { getDiver } from "../../diver/Diver";
import { BaseFish } from "../BaseFish";
import { School } from "./School";

interface Options {
  cohesion?: number;
  alignment?: number;
  separation?: number;
  separationDistance?: number;
}

/**  */
export class FlockingSystem extends BaseEntity implements Entity {
  public cohesion: number;
  public alignment: number;
  public separation: number;
  public separationDistance: number;
  public school?: School;
  public targetVelocity = V(0, 0);

  constructor(
    private fish: BaseFish,
    {
      cohesion = 1,
      alignment = 1,
      separation = 1,
      separationDistance = 1,
    }: Options = {}
  ) {
    super();

    this.cohesion = cohesion;
    this.alignment = alignment;
    this.separation = separation;
    this.separationDistance = separationDistance;
  }

  // store these here to avoid allocating
  private _fCohesion = V(0, 0);
  private _fAlignment = V(0, 0);
  private _fSeparation = V(0, 0);
  private _fAwayFromNeighbor = V(0, 0);

  updateTargetVelocity() {
    if (this.school) {
      const fishPosition = this.fish.getPosition();
      this._fCohesion
        .set(this.school.center)
        .isub(fishPosition)
        .imul(this.cohesion);

      this._fAlignment.set(this.school.velocity).imul(this.alignment);

      this._fSeparation.set(0, 0);
      for (const neighbor of this.school.getNeighbors(
        fishPosition,
        this.separationDistance
      )) {
        this._fAwayFromNeighbor.set(fishPosition).isub(neighbor.getPosition());
        this._fAwayFromNeighbor.magnitude =
          clampUp(
            this.separationDistance - this._fAwayFromNeighbor.magnitude
          ) ** 2;
        this._fSeparation.iadd(this._fAwayFromNeighbor);
      }
      this._fSeparation.imul(this.separation);

      this.targetVelocity
        .set(this._fCohesion)
        .iadd(this._fAlignment)
        .iadd(this._fSeparation);
    }
    return this.targetVelocity;
  }
}
