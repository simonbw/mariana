import { Body, Box } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { clamp, invLerp } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { Diver } from "../../diver/Diver";
import { UndertowSprite } from "./UndertowSprite";

export class Undertow extends BaseEntity implements Entity {
  body: Body;
  diver: Diver | undefined;

  constructor(
    position: V2d,
    public width = 5,
    public height = 10,
    public strength = 40
  ) {
    super();

    this.body = new Body({
      collisionResponse: false,
      mass: 0,
      position: position.clone(),
    });

    this.body.addShape(
      new Box({
        width,
        height,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.Diver,
      })
    );

    this.addChild(new UndertowSprite(this));
  }

  onTick(dt: number) {
    if (this.diver) {
      this.diver.body.applyForce(this.getVelocityAt(this.diver.getPosition()));
    }
  }

  private _outVelocity = V(0, 0);
  getVelocityAt(position: V2d): V2d {
    const dx = this.body!.position[0] - position[0];
    const offset = clamp(invLerp(this.width * 0.5, 0, Math.abs(dx)));
    const force = this.strength * offset ** 0.5;
    return this._outVelocity.set(0, force);
  }

  onBeginContact(other: Entity) {
    if (other instanceof Diver) {
      this.diver = other;
    }
  }

  onEndContact(other: Entity) {
    if (other instanceof Diver) {
      this.diver = undefined;
    }
  }
}
