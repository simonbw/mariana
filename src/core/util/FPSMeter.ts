import { Container, DisplayObject, Text } from "pixi.js";
import BaseEntity from "../entity/BaseEntity";
import Entity, { GameSprite } from "../entity/Entity";
import Game from "../Game";
import SpatialHashingBroadphase from "../physics/SpatialHashingBroadphase";

const SMOOTHING = 0.95;
export default class FPSMeter extends BaseEntity implements Entity {
  persistenceLevel = 100;
  lastUpdate: number;
  averageDuration: number = 0;
  slowFrameCount: number = 0;
  sprite: Text & GameSprite;

  constructor(layerName?: string) {
    super();
    this.lastUpdate = performance.now();
    this.sprite = new Text("", {
      fontSize: 12,
      fill: "white",
      align: "left",
      dropShadow: true,
      dropShadowDistance: 0,
      dropShadowBlur: 2,
    });
    this.sprite.layerName = layerName;
  }

  onAdd(game: Game) {
    this.averageDuration = 1 / 60;
  }

  onRender() {
    const now = performance.now();
    const duration = now - this.lastUpdate;
    this.averageDuration =
      SMOOTHING * this.averageDuration + (1.0 - SMOOTHING) * duration;
    this.lastUpdate = now;

    this.sprite.text = this.getText();
  }

  getStats() {
    const world = this.game?.world;
    const broadphase = this.game?.world.broadphase as SpatialHashingBroadphase;
    return {
      fps: Math.ceil(1000 / this.averageDuration),
      fps2: this.game!.getScreenFps(),
      bodyCount: world?.bodies.length ?? 0,
      hugeBodyCount: broadphase.hugeBodies?.size ?? 0,
      dynamicBodyCount: broadphase.dynamicBodies.size,
      kinematicBodyCount: broadphase.kinematicBodies.size,
      particleBodyCount: broadphase.particleBodies.size,
      entityCount: this.game?.entities.all.size ?? 0,
      spriteCount: getSpriteCount(this.game!.renderer.stage),
      collisions: (this.game?.world.broadphase as SpatialHashingBroadphase)
        .debugData.numCollisions,
    };
  }

  getText() {
    const {
      fps,
      fps2,
      bodyCount,
      hugeBodyCount,
      kinematicBodyCount,
      particleBodyCount,
      dynamicBodyCount,
      collisions,
      entityCount,
      spriteCount,
    } = this.getStats();
    return `fps: ${fps} (${fps2}) | bodies: ${bodyCount} (${kinematicBodyCount}, ${particleBodyCount}, ${dynamicBodyCount}, ${hugeBodyCount}) | collisions: ${collisions} | entities: ${entityCount} | sprites ${spriteCount}`;
  }
}

function getSpriteCount(root: DisplayObject): number {
  let total = 1;

  for (const child of (root as Container).children ?? []) {
    total += getSpriteCount(child);
  }

  return total;
}
