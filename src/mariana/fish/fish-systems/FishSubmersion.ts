import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { V, V2d } from "../../../core/Vector";
import { SurfaceSplash } from "../../effects/SurfaceSplash";
import { BaseFish } from "../BaseFish";

export class FishSubmersion extends BaseEntity implements Entity {
  surfaced: boolean = false;
  gravity: V2d;

  constructor(private fish: BaseFish) {
    super();
    this.gravity = V(0, fish.body.mass * 9.8);
  }

  onAdd(game: Game) {
    this.surfaced = this.fish.isSurfaced();
  }

  onTick() {
    const [x] = this.fish.getPosition();
    const surfaced = this.fish.isSurfaced();

    if (surfaced != this.surfaced) {
      this.game!.addEntity(
        new SurfaceSplash(x, this.fish.getVelocity().magnitude, 20)
      );
    }

    if (surfaced) {
      this.fish.body.applyForce(this.gravity);
    }

    this.surfaced = surfaced;
  }
}
