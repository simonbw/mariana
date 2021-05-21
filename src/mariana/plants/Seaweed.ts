import { Point } from "@pixi/math";
import { RopeGeometry } from "@pixi/mesh-extras";
import { Mesh, MeshMaterial, Sprite, Texture } from "pixi.js";
import img_seaweed1 from "../../../resources/images/flora/seaweed-1.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { colorLerp } from "../../core/util/ColorUtils";
import { clamp, lerp } from "../../core/util/MathUtil";
import { rInteger, rNormal } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getWaves } from "../environment/Waves";
import {
  TileLoadListener,
  TileUnloadListener,
} from "../world/loading/OnLoader";
import { getWorldMap } from "../world/WorldMap";

const SEGMENT_DISTANCE = 0.225;

interface Options {
  position: V2d;
  width: number;
}
export class Seaweed extends BaseEntity implements Entity {
  points: Point[];
  geometry: RopeGeometry;
  sprite: Sprite & GameSprite;

  t: number;
  rigidity = rNormal(8, 1);

  constructor(
    private position: V2d,
    private width: number = 1.0 + 1.2 * Math.random(),
    tint: number = colorLerp(0xffffff, 0xff8888, Math.random()),
    segments?: number
  ) {
    super();

    this.points = [];

    this.t = position.x * 0.1;

    if (segments == undefined) {
      const max = Math.min(48, Math.floor(position.y / SEGMENT_DISTANCE));
      const min = Math.floor(max / 4);
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
    this.sprite.tint = tint;
    this.sprite.layerName = Layer.WORLD_BACK;
    this.sprite.position.set(...position);
  }

  onAdd(game: Game) {
    // const waves = getWaves(game);
    // waves.getSurfaceHeight(this.position[0]);
    this.t = 0;

    const tilePos = getWorldMap(game)!.worldToTile(this.position);
    this.addChild(
      new TileUnloadListener(tilePos, (game) => {
        game.addEntity(
          new TileLoadListener(tilePos, (game) => {
            game.addEntity(
              new Seaweed(
                this.position,
                this.width,
                this.sprite.tint,
                this.points.length
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

    this.geometry.updateVertices();
  }
}
