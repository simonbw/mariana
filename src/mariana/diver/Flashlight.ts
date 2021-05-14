import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { getTimeOfDay } from "../environment/TimeOfDay";
import { DirectionalLight } from "../lighting/DirectionalLight";
import { Diver } from "./Diver";

const ACTIVATION_DEPTH = 80; // meters

export class Flashlight extends BaseEntity implements Entity {
  light: DirectionalLight;

  on: boolean = false;

  constructor(public diver: Diver) {
    super();

    this.light = this.addChild(
      new DirectionalLight({ length: 30, width: 18, intensity: 0.6 })
    );
  }

  onTick() {
    const isDeep = this.diver.getDepth() > ACTIVATION_DEPTH;
    const isNight = getTimeOfDay(this.game!).getNightPercent() > 0.9;
    const shouldBeOn = isDeep || isNight;

    if (!this.on && shouldBeOn) {
      this.turnOn;
    } else if (this.on && !shouldBeOn) {
      this.turnOff();
    }
  }

  async turnOn() {
    this.on = true;
    this.light.intensity = 1.0;
  }

  async turnOff() {
    this.on = false;
    this.light.intensity = 1.0;
  }

  onRender() {
    this.light.setPosition(this.diver.getPosition());
    this.light.rotation = this.diver.aimDirection.angle;
  }
}
