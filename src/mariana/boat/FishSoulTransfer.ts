import snd_bellPositive2 from "../../../resources/audio/ui/bell_positive_2.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { smoothStep } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { FishSoulSprite } from "../misc-stuff/FishSoulSprite";
import { SoulDepot } from "./SoulDepot";

const TRANSFER_TIME = 1.0;

export class FishSoulTransfer extends BaseEntity implements Entity {
  persistenceLevel = 1; // so they stay even when the menu is opened
  soulSprite: FishSoulSprite;
  startPosition: V2d;

  constructor(
    startPosition: V2d,
    public depot: SoulDepot,
    public amount: number = 1,
    public onComplete?: () => void
  ) {
    super();
    this.soulSprite = this.addChild(new FishSoulSprite(amount));
    this.startPosition = startPosition.clone();
  }

  async onAdd(game: Game) {
    const p = V(0, 0);
    await this.wait(TRANSFER_TIME, (dt, t) => {
      p.set(this.startPosition).ilerp(
        this.depot.getPosition(),
        smoothStep(t ** 2)
      );
      this.soulSprite.setPosition(p);
    });

    game.dispatch(depositSoulsEvent(this.amount, this.depot));
    game.addEntity(new SoundInstance(snd_bellPositive2, { gain: 0.05 }));
    this.destroy();
  }
}

export interface DepositSoulsEvent {
  type: "depositSouls";
  amount: number;
  depot: SoulDepot;
}

function depositSoulsEvent(
  amount: number,
  depot: SoulDepot
): DepositSoulsEvent {
  return { type: "depositSouls", amount, depot };
}
