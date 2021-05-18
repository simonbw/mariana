import { SCALE_MODES, Sprite, Text } from "pixi.js";
import img_boat from "../../../resources/images/environment/boat.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { degToRad, lerp, polarToVec } from "../../core/util/MathUtil";
import { V } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getDiver } from "../diver/Diver";
import { getWaves } from "../environment/Waves";
import { FONT_HEADING } from "../config/fonts";
import { PointLight } from "../lighting/PointLight";
import { DiveBell } from "./DiveBell";
import { UpgradeId } from "../upgrade/upgrades";

const BOAT_X = 0;
const BOAT_WIDTH = 8; // meters

const SHOP_RANGE = 7;
const DROPOFF_RANGE = 9;
const SHOP_DEPTH = 4;
const TOOLTIP_SPEED = 5;

const WAVE_FREQUENCY = 0.3; // Hz
const WAVE_AMPLITUDE = 0.23; // meters

// The boat on the surface
export class Boat extends BaseEntity implements Entity {
  persistenceLevel = 1;
  id = "boat";

  sprite: Sprite & GameSprite;
  tooltip: Text;
  light: PointLight;

  elapsedTime = 0;

  constructor() {
    super();

    this.sprite = Sprite.from(img_boat, { scaleMode: SCALE_MODES.NEAREST });
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.x = 0;
    this.sprite.y = 0;
    this.sprite.anchor.set(0.5, 0.55);
    this.sprite.scale.set(BOAT_WIDTH / this.sprite.texture.width);

    this.tooltip = new Text("Press E To Shop", {
      fontSize: 24,
      fill: "black",
      fontFamily: FONT_HEADING,
    });
    this.tooltip.position.set(0, 10);
    this.tooltip.anchor.set(0.5, 0);
    this.tooltip.alpha = 0;
    this.tooltip.texture.baseTexture.scaleMode = SCALE_MODES.LINEAR;

    this.sprite.addChild(this.tooltip);

    this.light = this.addChild(
      new PointLight({ size: 20, intensity: 0.2, color: 0xffeedd })
    );
  }

  diverIsPresent() {
    const diver = getDiver(this.game);
    if (!diver) {
      return false;
    }

    const xDistance = Math.abs(diver.getPosition().x - BOAT_X);
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
      degToRad(-30) + this.sprite.rotation,
      3,
      this._launchPosition
    ).iadd([this.sprite.x, this.sprite.y]);
  }

  getDropoffPosition() {
    return V(this.sprite.x, this.sprite.y - 1);
  }

  onRender(dt: number) {
    if (!this.game?.paused) {
      this.elapsedTime += dt;
    }

    const usingGamepad = this.game!.io.usingGamepad;
    if (getDiver(this.game!)?.onBoat) {
      this.tooltip.text = `Press ${usingGamepad ? "A" : "SPACE"} To Dive`;
    } else {
      this.tooltip.text = `Press ${usingGamepad ? "Y" : "E"} To Shop`;
    }

    this.tooltip.alpha = lerp(
      this.tooltip.alpha,
      this.diverIsPresent() ? 1 : 0,
      dt * TOOLTIP_SPEED
    );

    const t = this.elapsedTime * WAVE_FREQUENCY * Math.PI;
    const waves = getWaves(this.game!);
    this.sprite.y = waves.getSurfaceHeight(0);
    this.sprite.rotation = waves.getSurfaceAngle(0);

    this.light.setPosition(this.getDropoffPosition());
  }

  handlers = {
    upgradeBought: ({ upgradeId }: { upgradeId: UpgradeId }) => {
      if (upgradeId === "oxygenBuoy") {
        this.addChild(new DiveBell(V(3, -1)));
      }
    },
  };
}

export function getBoat(game?: Game): Boat | undefined {
  return game?.entities.getById("boat") as Boat;
}
