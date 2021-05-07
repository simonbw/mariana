import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SurfaceSplash } from "../effects/SurfaceSplash";
import { Diver } from "./Diver";

/** Keeps track of whether or not the diver is submerged */
export class Submersion extends BaseEntity implements Entity {
  wasAboveWater: boolean = false;

  constructor(public diver: Diver) {
    super();
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
