import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { FishSoulTransfer } from "../boat/FishSoulTransfer";
import { SoulDepot } from "../boat/SoulDepot";
import { makeSoulDrops } from "../misc-stuff/FishSoul";
import { Diver } from "./Diver";

export class Inventory extends BaseEntity implements Entity {
  fishSouls: number = 0;

  constructor(public diver: Diver) {
    super();
  }

  /** Creates FishSoulTransfers */
  transferSouls(depositPoint: SoulDepot) {
    const value = Math.ceil(this.fishSouls / 20);
    if (value > 0) {
      const position = this.diver.getPosition();
      this.game!.addEntity(new FishSoulTransfer(position, depositPoint, value));
      this.fishSouls -= value;
    }
  }

  handlers = {
    diverDied: () => {
      const center = this.diver.getPosition();
      this.game?.addEntities(makeSoulDrops(center, this.fishSouls));
      this.fishSouls = 0;
    },

    fishSoulCollected: ({ value }: { value: number }) => {
      this.fishSouls += value;
    },
  };
}
