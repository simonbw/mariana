import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { degToRad, polarToVec } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { getDiver } from "../diver/Diver";
import { getWaves } from "../environment/Waves";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { UpgradeId } from "../upgrade/upgrades";
import { BoatSprite } from "./BoatSprite";
import { DiveBell } from "./dive-bell/DiveBell";

const SHOP_RANGE = 7;
const DROPOFF_RANGE = 9;
const SHOP_DEPTH = 4;

/** The boat on the surface */
export class Boat extends BaseEntity implements Entity {
  persistenceLevel = 1;
  id = "boat";
  boatSprite: BoatSprite;
  x: number = 0;

  constructor() {
    super();
    this.boatSprite = this.addChild(new BoatSprite(this));
  }

  onAdd(game: Game) {
    if (getUpgradeManager(game).hasUpgrade("diveBell")) {
      this.addChild(new DiveBell(V(6, -1)));
    }
  }

  private _position = V(0, 0);
  getPosition() {
    const y = getWaves(this.game!).getSurfaceHeight(this.x);
    return this._position.set(this.x, y);
  }

  diverIsPresent() {
    const diver = getDiver(this.game);
    if (!diver) {
      return false;
    }

    const xDistance = Math.abs(diver.getPosition().x - this.x);
    const yDistance = diver.getDepth();
    return yDistance < SHOP_DEPTH && xDistance < SHOP_RANGE;
  }

  diverWithinDropoffRange() {
    const diver = getDiver(this.game);
    if (!diver) {
      return false;
    }

    const distance = diver.getPosition().isub(this.getDropoffPosition())
      .magnitude;
    return distance < DROPOFF_RANGE;
  }

  openShopIfDiverPresent() {
    if (this.diverIsPresent()) {
      this.game?.dispatch({ type: "openShop" });
    }
  }

  onKeyDown(key: KeyCode) {
    if (key === "KeyE") {
      this.openShopIfDiverPresent();
    }
  }

  onButtonDown(button: ControllerButton) {
    if (button === ControllerButton.Y) {
      this.openShopIfDiverPresent();
    }
  }

  private _launchPosition = V(0, 0);
  getLaunchPosition() {
    return polarToVec(
      degToRad(-30) + this.boatSprite.sprite.rotation,
      3,
      this._launchPosition
    ).iadd(this.getPosition());
  }

  private _dropoffPosition = V(0, 0);
  getDropoffPosition() {
    return this._dropoffPosition.set(this.getPosition()).iadd([0, -1]);
  }

  handlers = {
    upgradeBought: ({ upgradeId }: { upgradeId: UpgradeId }) => {
      if (upgradeId === "diveBell") {
        this.addChild(new DiveBell(V(6, -1)));
      }
    },
  };
}

export function getBoat(game?: Game): Boat | undefined {
  return game?.entities.getById("boat") as Boat;
}
