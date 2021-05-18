import { Point } from "@pixi/math";
import { RopeGeometry } from "@pixi/mesh-extras";
import { vec2 } from "p2";
import { Graphics, Mesh, MeshMaterial, Sprite, Texture } from "pixi.js";
import img_seaweed1 from "../../../resources/images/flora/seaweed-1.png";
import img_pickup1 from "../../../resources/images/particles/pickup-1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { clamp, lerp } from "../../core/util/MathUtil";
import { rInteger, rNormal } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getDiver } from "../diver/Diver";
import { getWaves } from "../environment/Waves";
import { FishSoul } from "../FishSoul";
import { PointLight } from "../lighting/PointLight";
import {
  TileLoadListener,
  TileUnloadListener,
} from "../world/loading/OnLoader";
import { getWorldMap } from "../world/WorldMap";

const SEGMENT_DISTANCE = 0.225;

export class Soulweed extends BaseEntity implements Entity {
  points: Point[];
  geometry: RopeGeometry;
  sprite: Sprite & GameSprite;

  t: number;
  rigidity = rNormal(16, 2);
  buds: SoulweedBud[];

  constructor(
    private position: V2d,
    private width: number = 3.5 + 1.0 * Math.random(),
    segments?: number,
    budsGrowns: number[] = []
  ) {
    super();

    this.points = [];

    this.t = position.x * 0.1;

    if (segments == undefined) {
      const max = Math.min(36, Math.floor(position.y / SEGMENT_DISTANCE));
      const min = Math.floor(max / 2);
      segments = rInteger(min, max);
    }
    for (let i = 0; i < segments; i++) {
      this.points.push(new Point(0, -i * SEGMENT_DISTANCE));
    }

    this.geometry = new RopeGeometry(width, this.points);
    const mesh = new Mesh(
      this.geometry,
      new MeshMaterial(Texture.from(img_seaweed1), {})
    );

    this.sprite = new Sprite();
    this.sprite.addChild(mesh);
    this.sprite.tint = 0xff5555;
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.position.set(...position);

    this.buds = [];
    const numBuds = Math.floor(segments / 6);
    for (let i = 0; i < numBuds; i++) {
      this.buds.push(
        this.addChild(new SoulweedBud(position.clone(), budsGrowns[i]))
      );
    }
  }

  onAdd(game: Game) {
    const waves = getWaves(game);
    waves.getSurfaceHeight(this.position[0]);
    this.t = 0;

    const tilePos = getWorldMap(game)!.worldToTile(this.position);
    this.addChild(
      new TileUnloadListener(tilePos, (game) => {
        game.addEntity(
          new TileLoadListener(tilePos, (game) => {
            const budsGrown = this.buds.map((bud) => bud.grown);
            game.addEntity(
              new Soulweed(
                this.position,
                this.width,
                this.points.length,
                budsGrown
              )
            );
          })
        );
        this.destroy();
      })
    );
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

    for (const [i, bud] of this.buds.entries()) {
      const budPercent = i / (this.buds.length - 1);
      const heightPercent = lerp(0.2, 0.8, budPercent);
      const pointI = Math.floor(this.points.length * heightPercent);
      const point = this.points[pointI];
      const isLeft = i % 2 == 0;
      const xOffset = (isLeft ? -1 : 1) * (1.0 - heightPercent);
      const x = this.position[0] + point.x + xOffset;
      const y = this.position[1] + point.y;
      bud.setPosition([x, y]);
    }

    this.geometry.updateVertices();
  }
}

const SECONDS_TO_MATURE = 60.0;
const MAX_VALUE = 20.0;
const ACTIVATION_DISTANCE = 2.0;

export class SoulweedBud extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;
  light: PointLight;

  constructor(private position: V2d = V(0, 0), public grown: number = 1) {
    super();

    this.sprite = Sprite.from(img_pickup1);
    this.sprite.tint = 0x00ff00;
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(...position);

    this.sprite.alpha = 0.7;
    this.sprite.layerName = Layer.GLOW;

    this.light = this.addChild(
      new PointLight({ position: this.position, size: 4, color: 0x00ff00 })
    );
  }

  setPosition(position: [number, number]) {
    this.position.set(position);
    this.sprite.position.set(position[0], position[1]);
    this.light.setPosition(position);
  }

  onSlowTick(dt: number) {
    this.grown = clamp(this.grown + dt / SECONDS_TO_MATURE, 0, 1);

    if (this.grown >= 1) {
      const diver = getDiver(this.game!);
      if (
        diver &&
        vec2.distance(diver.getPosition(), this.position) < ACTIVATION_DISTANCE
      ) {
        this.game?.addEntity(new FishSoul(this.position, MAX_VALUE));
        this.grown = 0;
      }
    }
  }

  onRender() {
    const r = 0.2 + 0.4 * this.grown ** 0.7;
    this.sprite.width = r;
    this.sprite.height = r;
    this.light.intensity = this.grown;
  }
}
