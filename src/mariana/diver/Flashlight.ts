import snd_flashlightOff from "../../../resources/audio/diver/flashlight-off.flac";
import snd_flashlightOn from "../../../resources/audio/diver/flashlight-on.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { getTimeOfDay } from "../environment/TimeOfDay";
import { DirectionalLight } from "../lighting/DirectionalLight";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { Diver } from "./Diver";

const ACTIVATION_DEPTH = 80; // meters
const INTENSITY = 0.6;

/** Shines a light in the dark */
export class Flashlight extends BaseEntity implements Entity {
  light: DirectionalLight;

  on: boolean = false;

  constructor(public diver: Diver) {
    super();

    this.light = this.addChild(
      new DirectionalLight({ length: 30, width: 18, intensity: 0 })
    );
  }

  onTick() {
    const isDeep = this.diver.getDepth() > ACTIVATION_DEPTH;
    const isNight = getTimeOfDay(this.game!).getNightPercent() > 0.5;
    const isPurchased = getUpgradeManager(this.game!).hasUpgrade("flashlight");
    const shouldBeOn = isPurchased && (isDeep || isNight);

    if (!this.on && shouldBeOn) {
      this.turnOn();
    } else if (this.on && !shouldBeOn) {
      this.turnOff();
    }
  }

  async turnOn() {
    this.on = true;
    this.light.intensity = INTENSITY;
    this.game!.addEntity(new SoundInstance(snd_flashlightOn));
  }

  async turnOff() {
    this.on = false;
    this.light.intensity = 0.0;
    this.game!.addEntity(new SoundInstance(snd_flashlightOff));
  }

  onRender() {
    this.light.setPosition(this.diver.getPosition());
    this.light.rotation = this.diver.aimDirection.angle;
  }
}
