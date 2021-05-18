import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { clamp, clampUp } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { getWorldMap } from "../../world/WorldMap";
import { BaseFish } from "../BaseFish";
import { School } from "./School";

interface Options {
  /** How strongly this fish will say with the group */
  cohesion?: number;
  /** How strongly this fish go in the same direction as the group */
  alignment?: number;
  /** How strongly this fish will avoid others in the group */
  separation?: number;
  /** How far away from other group members this fish will try to stay */
  separationDistance?: number;
  /** How strongly this fish will move towards/away from attractors/repulsors */
  attraction?: number;
  /** How strongly this fish will move away from the ground */
  avoidance?: number;
}

/** Provides 2d flocking behavior based on 4 principals:
 *
 * Cohesion - moving towards the center of the group
 * Alignment - matching velocity with the group
 * Separation - avoiding nearby members of the group
 * Attraction - moving towards/away from specific points
 */
export class FlockingSystem extends BaseEntity implements Entity {
  /** How strongly this fish will say with the group */
  public cohesion: number;
  /** How strongly this fish go in the same direction as the group */
  public alignment: number;
  /** How strongly this fish will avoid others in the group */
  public separation: number;
  /** How far away from other group members this fish will try to stay */
  public separationDistance: number;
  /** How strongly this fish will move towards/away from attractors/repulsors */
  public attraction: number;
  /** How strongly this fish will move away from the ground */
  public avoidance: number;

  public school?: School;
  public targetVelocity = V(0, 0);

  constructor(
    private fish: BaseFish,
    {
      cohesion = 1,
      alignment = 1,
      separation = 1,
      separationDistance = 1,
      attraction = 1,
      avoidance = 1,
    }: Options = {}
  ) {
    super();

    this.cohesion = cohesion;
    this.alignment = alignment;
    this.separation = separation;
    this.separationDistance = separationDistance;
    this.attraction = attraction;
    this.avoidance = avoidance;
  }

  // cached to avoid allocations
  private _fCohesion = V(0, 0);

  /** Calculates the cohesion vector */
  private getCohesionForce(): V2d {
    return this._fCohesion
      .set(this.school!.center)
      .isub(this.fish.getPosition())
      .imul(this.cohesion);
  }

  // cached to avoid allocations
  private _fAlignment = V(0, 0);

  /** Calculates the alignment vector */
  private getAlignmentForce(): V2d {
    if (this.school) {
      this._fAlignment.set(this.school.velocity).imul(this.alignment);
    }
    return this._fAlignment;
  }

  // cached to avoid allocations
  private _fSeparation = V(0, 0);
  private _awayFromNeighbor = V(0, 0);

  /** Calculates the separation vector */
  private getSeparationForce(): V2d {
    if (this.school) {
      const fishPos = this.fish.getPosition();
      this._fSeparation.set(0, 0);

      const neighbors = this.school.getNeighbors(
        fishPos,
        this.separationDistance
      );

      for (const neighbor of neighbors) {
        this._awayFromNeighbor.set(fishPos).isub(neighbor.getPosition());
        const distance = this._awayFromNeighbor.magnitude;
        this._awayFromNeighbor.magnitude =
          clampUp(this.separationDistance - distance) ** 2;
        this._fSeparation.iadd(this._awayFromNeighbor);
      }
      this._fSeparation.imul(this.separation);
    }
    return this._fSeparation;
  }

  // cached to avoid allocations
  private _fAttractors = V(0, 0);
  private _toAttractor = V(0, 0);

  /** Calculates the attraction vector */
  private getAttractionForce(): V2d {
    if (this.school) {
      const fishPosition = this.fish.getPosition();
      this._fAttractors.set(0, 0);
      for (const attractor of this.school.attractors) {
        this._toAttractor.set(attractor.position).isub(fishPosition);
        const distance = this._toAttractor.magnitude;
        const percent = 1 - clamp(distance / attractor.radius);
        this._toAttractor.magnitude = attractor.strength * percent;
        this._fAttractors.iadd(this._toAttractor);
      }
      this._fAttractors.imul(this.attraction);
    }
    return this._fAttractors;
  }

  private _fAvoid = V(0, 0);
  private getAvoidanceForce(): V2d {
    const worldMap = getWorldMap(this.game!)!;
    const pos = this.fish.getPosition();
    const [tx, ty] = worldMap.worldToTile(pos);

    this._fAvoid.set(0, 0);

    if (worldMap.groundMap.tileIsSolid([tx - 1, ty])) {
      this._fAvoid.iadd([10, 0]);
    }
    if (worldMap.groundMap.tileIsSolid([tx + 1, ty])) {
      this._fAvoid.iadd([-10, 0]);
    }
    if (worldMap.groundMap.tileIsSolid([tx, ty + 1])) {
      this._fAvoid.iadd([0, -10]);
    }
    if (worldMap.groundMap.tileIsSolid([tx, ty - 1])) {
      this._fAvoid.iadd([0, 10]);
    }

    if (pos.y < 3) {
      const p = clamp((3.0 - pos.y) / 3);
      this._fAvoid.iadd([0, p * 10]);
    }

    this._fAvoid.imul(this.avoidance);

    return this._fAvoid;
  }

  updateTargetVelocity() {
    if (this.school) {
      this.targetVelocity
        .set(this.getCohesionForce())
        .iadd(this.getAlignmentForce())
        .iadd(this.getSeparationForce())
        .iadd(this.getAttractionForce())
        .iadd(this.getAvoidanceForce());
    }
    return this.targetVelocity;
  }
}
