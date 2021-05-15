import { Point } from "@pixi/math";
import { RopeGeometry } from "@pixi/mesh-extras";
import { Graphics, Mesh, MeshMaterial, Sprite, Texture } from "pixi.js";
import img_seaweed1 from "../../../resources/images/flora/seaweed-1.png";
import img_pickup1 from "../../../resources/images/particles/pickup-1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { clamp, lerp } from "../../core/util/MathUtil";
import { rInteger, rNormal, rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves } from "../environment/Waves";
import { FishSoul } from "../FishSoul";

const SEGMENT_DISTANCE = 0.225;

export class SoulPlant extends BaseEntity implements Entity {
  points: Point[];
  geometry: RopeGeometry;
  sprite: Sprite & GameSprite;

  t: number;
  rigidity = rNormal(16, 2);

  constructor(private position: V2d) {
    super();

    this.points = [];

    this.t = position.x * 0.1;
    const width = 4.0;

    const max = Math.min(48, Math.floor(position.y / SEGMENT_DISTANCE));
    const min = Math.floor(max / 2);
    const n = rInteger(min, max);
    for (let i = 0; i < n; i++) {
      this.points.push(new Point(0, -i * SEGMENT_DISTANCE));
    }

    this.geometry = new RopeGeometry(width, this.points);
    const mesh = new Mesh(
      this.geometry,
      new MeshMaterial(Texture.from(img_seaweed1), {})
    );
    mesh.tint = 0xff0000;

    this.sprite = new Sprite();
    this.sprite.addChild(mesh);

    const graphics = new Graphics();
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(0, 0, 1);
    graphics.endFill();
    // this.sprite.addChild(graphics);

    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.position.set(...position);

    this.addChild(new SoulPlantBud(position.add([-0.5, -1])));
    this.addChild(new SoulPlantBud(position.add([0.5, -1.3])));
    this.addChild(new SoulPlantBud(position.add([0.5, -2.3])));
    this.addChild(new SoulPlantBud(position.add([-0.5, -1.9])));
  }

  onAdd(game: Game) {
    const waves = getWaves(game);
    waves.getSurfaceHeight(this.position[0]);
    this.t = 0;
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

const SECONDS_TO_MATURE = 10000.0;

export class SoulPlantBud extends BaseEntity implements Entity {
  grown: number = 0;
  sprite: Sprite & GameSprite;

  constructor(public position: V2d) {
    super();

    this.sprite = Sprite.from(img_pickup1);
    this.sprite.tint = 0x00ff00;
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(...position);
  }

  onSlowTick(dt: number) {
    this.grown = this.grown + dt / SECONDS_TO_MATURE;

    if (this.grown > 1) {
      this.grown = 0;
      this.game?.addEntity(new FishSoul(this.position, 1));
    }
  }

  onRender() {
    const r = 0.2 + 0.4 * this.grown ** 0.7;
    this.sprite.width = r;
    this.sprite.height = r;
  }
}
