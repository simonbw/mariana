import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { V } from "../../../core/Vector";
import { BaseFish } from "../BaseFish";

interface Options {
  drag?: number;
  lift?: number;
  thrust?: number;
}

/**  */
export class Hydrodynamics extends BaseEntity implements Entity {
  public lift: number;
  public drag: number;
  public thrust: number;

  constructor(
    private fish: BaseFish,
    { drag = 0.2, lift = 1.0, thrust = 1 }: Options = {}
  ) {
    super();

    this.drag = drag;
    this.lift = lift;
    this.thrust = thrust;
  }

  // store here to avoid allocating
  private _heading = V(1, 0);
  private _normal = V(0, 1);
  private _fThrust = V(0, 0);
  private _fDrag = V(0, 0);
  private _fLift = V(0, 0);
  private _force = V(0, 0);

  onTick(dt: number) {
    if (this.fish.isSurfaced()) {
      this.fish.body.angle = this.fish.getVelocity().angle;
    } else {
      this.applyForces(dt);
    }
  }

  applyForces(dt: number) {
    const velocity = this.fish.getVelocity();
    const fish = this.fish;
    const body = fish.body;

    this._heading.angle = body.angle;
    this._heading.inormalize();
    this._normal.set(this._heading).irotate90ccw();

    // from the fish swimming
    const drag = velocity.dot(this._heading) * -this.drag;
    const lift = this._normal.dot(velocity) * -this.lift;

    this._fThrust.set(this._heading).imul(this.thrust);
    this._fDrag.set(this._heading).imul(drag);
    this._fLift.set(this._normal).imul(lift);

    this._force.set(this._fThrust).iadd(this._fDrag).iadd(this._fLift);
    body.applyForce(this._force);
  }
}
