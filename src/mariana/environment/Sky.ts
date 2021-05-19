import { Sprite } from "@pixi/sprite";
import { Filter } from "pixi.js";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { rBool, rUniform } from "../../core/util/Random";
import { V } from "../../core/Vector";
import { Layer } from "../config/layers";
import {
  WORLD_LEFT_EDGE,
  WORLD_RIGHT_EDGE,
  WORLD_SIZE_METERS,
} from "../constants";
import { Cloud } from "./Cloud";
import { Daylight } from "./Daylight";
import frag_sky from "./sky.frag";
import { Stars } from "./Stars";
import { getTimeOfDay, TIME_UNIFORMS } from "./TimeOfDay";
import { Wind } from "./Wind";

const NUM_CLOUDS = 60;

export class Sky extends BaseEntity implements Entity {
  id = "sky";
  filter: Filter;

  constructor() {
    super();

    const sprite = (this.sprite = new Sprite());
    sprite.anchor.set(0.5, 1.0);
    sprite.y = 10;
    sprite.width = WORLD_SIZE_METERS[0];
    sprite.height = 100;

    this.filter = new Filter(undefined, frag_sky);
    sprite.filters = [this.filter];

    this.sprite.layerName = Layer.SKY;

    for (let i = 0; i < NUM_CLOUDS; i++) {
      const x = rUniform(WORLD_LEFT_EDGE, WORLD_RIGHT_EDGE);
      const y = rUniform(-8, -12);
      const front = rBool();
      this.addChild(new Cloud(V(x, y), front));
    }

    this.addChild(new Daylight());
    this.addChild(new Stars());
    this.addChild(new Wind());
  }

  getUniforms() {
    const resolution = this.filter.resolution;
    const cameraMatrix = this.game?.camera
      .getMatrix([0.01, 0.5])
      .scale(resolution, resolution)
      .invert();
    const hour = getTimeOfDay(this.game!).hour;
    return {
      cameraMatrix,
      resolution,
      skyHeight: 30,
      hour,
      ...TIME_UNIFORMS,
    };
  }

  onRender() {
    for (const [uniform, value] of Object.entries(this.getUniforms())) {
      this.filter.uniforms[uniform] = value;
    }
  }
}
