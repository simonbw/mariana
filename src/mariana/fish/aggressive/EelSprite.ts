import { Graphics } from "@pixi/graphics";
import { Mesh, MeshMaterial } from "@pixi/mesh";
import { Sprite } from "@pixi/sprite";
import { Point, RopeGeometry, Texture } from "pixi.js";
import img_eelBody1 from "../../../../resources/images/fish/eel-body-1.png";
import img_eelHead1 from "../../../../resources/images/fish/eel-head-1.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { degToRad, normalizeAngle } from "../../../core/util/MathUtil";
import { Eel } from "./Eel";

const WIDTH = 0.5;
const HEAD_SIZE = 1.2;

export class EelSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite = new Sprite();
  bodyGraphics: Graphics = new Graphics();
  headSprite: Sprite;
  headScale: number;

  shouldDrawCenters = false;
  shouldDrawDirections = false;

  geometry: RopeGeometry;
  mesh: Mesh;

  points: Point[] = [];

  constructor(private eel: Eel) {
    super();

    // this.sprite.addChild(this.bodyGraphics);

    this.headSprite = Sprite.from(img_eelHead1);
    this.headScale = HEAD_SIZE / this.headSprite.texture.width;
    this.headSprite.scale.set(this.headScale);
    this.headSprite.anchor.set(0.7, 0.5);
    this.sprite.addChild(this.headSprite);

    for (const body of eel.bodies) {
      const [x, y] = body.position;
      this.points.push(new Point(x, y));
    }

    this.geometry = new RopeGeometry(WIDTH, this.points);
    const shader = new MeshMaterial(Texture.from(img_eelBody1));
    this.mesh = new Mesh(this.geometry, shader);

    this.sprite.addChild(this.mesh);
  }

  onRender(dt: number) {
    const headPosition = this.eel.bodies[0].position;
    this.headSprite.position.set(...headPosition);

    const headAngle = normalizeAngle(this.eel.directions[0].angle);
    this.headSprite.rotation = headAngle;

    const flip = headAngle < degToRad(-90) || headAngle > degToRad(90);
    this.headSprite.scale.set(
      this.headScale,
      flip ? -this.headScale : this.headScale
    );

    for (const [i, body] of this.eel.bodies.entries()) {
      const [x, y] = body.position;
      this.points[i].set(x, y);
    }
    this.geometry.updateVertices();

    this.drawSegments();
  }

  drawSegments() {
    this.bodyGraphics.clear();
    const bodies = this.eel.bodies;

    this.bodyGraphics.lineStyle({
      width: WIDTH,
      color: 0x00cc00,
      miterLimit: degToRad(90),
    });
    this.bodyGraphics.moveTo(...bodies[0].position);
    for (let i = 1; i < bodies.length; i++) {
      const t = i / bodies.length;
      const body = bodies[i];
      this.bodyGraphics.lineTo(...body.position);
    }

    if (this.shouldDrawCenters) {
      this.bodyGraphics.lineStyle();
      for (const [i, body] of bodies.entries()) {
        const r = i === 0 ? 0.2 : 0.1;
        this.bodyGraphics.beginFill(0x009900);
        const [x, y] = body.position;
        this.bodyGraphics.drawCircle(x, y, r);
        this.bodyGraphics.endFill();
      }
    }

    if (this.shouldDrawDirections) {
      this.bodyGraphics.lineStyle({ width: 0.1, color: 0xff0000 });
      for (const [i, body] of bodies.entries()) {
        const [x, y] = body.position;
        const [dx, dy] = this.eel.getSegmentDirection(i);
        this.bodyGraphics.moveTo(x, y);
        this.bodyGraphics.lineTo(x + dx, y + dy);
      }
    }
  }
}
