import { Point } from "@pixi/math";
import { RopeGeometry } from "@pixi/mesh-extras";
import { Graphics, Mesh, MeshMaterial, Sprite, Texture } from "pixi.js";
import img_seaweed1 from "../../../resources/images/flora/seaweed-1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { clamp, lerp } from "../../core/util/MathUtil";
import { rInteger, rNormal, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves } from "../environment/Waves";

const SEGMENT_DISTANCE = 0.2;

export class Seaweed extends BaseEntity implements Entity {
  points: Point[];
  geometry: RopeGeometry;
  sprite: Sprite & GameSprite;

  t: number;
  rigidity = rNormal(8, 0);

  constructor(position: V2d) {
    super();

    this.points = [];

    this.t = position.x * 0.1;
    const width = 2.0 + Math.random();

    const n = rInteger(20, 40);
    for (let i = 0; i < n; i++) {
      this.points.push(new Point(0, -i * SEGMENT_DISTANCE));
    }

    this.geometry = new RopeGeometry(width, this.points);
    const mesh = new Mesh(
      this.geometry,
      new MeshMaterial(Texture.from(img_seaweed1), {})
    );

    this.sprite = new Sprite();
    this.sprite.addChild(mesh);

    const graphics = new Graphics();
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(0, 0, 1);
    graphics.endFill();
    // this.sprite.addChild(graphics);

    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.position.set(...position);
  }

  onRender(dt: number) {
    this.t += dt;

    const waves = getWaves(this.game!);
    const T = waves.getWaveStats().T;
    const waterForce = Math.sin((this.t / T) * Math.PI) * dt;
    this.points;
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1];
      const b = this.points[i];

      b.x += waterForce;
      b.x = lerp(b.x, a.x, clamp(dt * this.rigidity));
    }

    this.geometry.updateVertices();
  }
}
