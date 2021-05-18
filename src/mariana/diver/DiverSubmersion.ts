import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SurfaceSplash } from "../effects/SurfaceSplash";
import { Diver } from "./Diver";

/** Keeps track of whether or not the diver is submerged */
export class DiverSubmersion extends BaseEntity implements Entity {
  wasAboveWater: boolean = true;

  constructor(public diver: Diver) {
    super();
  }

  onAdd() {
    this.wasAboveWater = this.diver.isSurfaced();
  }

  onTick() {
    const diver = this.diver;
    const isAboveWater = diver.isSurfaced() ?? true;

    if (this.wasAboveWater != isAboveWater) {
      if (isAboveWater) {
        this.game?.dispatch({ type: "diverSubmerged", diver });
      } else {
        this.game?.dispatch({ type: "diverSurfaced", diver });
      }

      const diverPosition = diver.getPosition();
      const speed = Math.abs(diver.body.velocity[1]);
      this.game!.addEntity(new SurfaceSplash(diverPosition[0], speed, 30));
    }

    this.wasAboveWater = isAboveWater;
  }
}
