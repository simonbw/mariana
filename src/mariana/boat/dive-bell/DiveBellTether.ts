import { Graphics } from "@pixi/graphics";
import type BezierClass from "bezier-js";
import { Body, DistanceConstraint, vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { clamp } from "../../../core/util/MathUtil";
import { V } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { Boat, getBoat } from "../Boat";
import { DepositSoulsEvent } from "../FishSoulTransfer";
import { DiveBell } from "./DiveBell";
const Bezier = require("bezier-js") as typeof BezierClass;

export class DiveBellTether extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  constraints: DistanceConstraint[] = [];
  bodies: Body[] = [];
  private controlPoint = V(0, 0);
  curve: BezierClass;
  bulges: { t: number; size: number }[] = [];
  bulgeQueue = 0;

  constructor(private diveBell: DiveBell, private boat: Boat) {
    super();

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_BACK;
    this.curve = new Bezier([0, 0, 0, 0, 0, 0]);
  }

  onAdd(game: Game) {
    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = this.boat.getPosition();
    this.controlPoint.set((bellX + boatX) / 2, (bellY + boatY) / 2);
  }

  private bulgeCooldown = false;
  async sendBulge() {
    if (!this.bulgeCooldown) {
      this.bulgeCooldown = true;
      const amount = clamp(this.bulgeQueue, 0, 200);
      const size = 0.5 + 0.5 * amount ** 0.3;
      this.bulgeQueue -= amount;
      this.bulges.push({ t: 0, size });

      await this.wait(0.2);

      this.bulgeCooldown = false;

      if (this.bulgeQueue > 0) {
        this.sendBulge();
      }
    }
  }

  async queueBulge(amount: number) {
    this.bulgeQueue += amount;

    await this.wait(0.1);
    this.sendBulge();
  }

  updateCurve() {
    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = getBoat(this.game)!.getPosition();
    const [cx, cy] = this.controlPoint;

    this.curve.points[0].x = bellX;
    this.curve.points[0].y = bellY;
    this.curve.points[1].x = cx;
    this.curve.points[1].y = cy;
    this.curve.points[2].x = boatX;
    this.curve.points[2].y = boatY;
    this.curve.update();
  }

  onRender(dt: number) {
    this.sprite.clear();
    this.sprite.lineStyle({ width: 0.2, color: 0x004400 });

    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = getBoat(this.game)!.getPosition();
    this.controlPoint.ilerp([(bellX + boatX) / 2, bellY], clamp(dt));

    this.updateCurve();

    this.sprite.moveTo(bellX, bellY);
    for (const point of this.curve.getLUT(100)) {
      this.sprite.lineTo(point.x, point.y);
    }
    this.sprite.lineTo(boatX, boatY);

    this.sprite.lineStyle();
    const speed = 10.0 / vec2.dist([bellX, bellY], [boatX, boatY]);
    for (let i = this.bulges.length - 1; i > 0; i--) {
      const bulge = this.bulges[i];
      bulge.t += dt * speed;

      if (bulge.t >= 1) {
        this.bulges.splice(i, 1);
      } else {
        const { x, y } = this.curve.get(bulge.t);
        this.sprite.beginFill(0x004400);
        this.sprite.drawCircle(x, y, bulge.size * 0.21);
        this.sprite.endFill();
      }
    }
  }

  handlers = {
    depositSouls: ({ amount, depot }: DepositSoulsEvent) => {
      if (depot === this.diveBell.soulDepot) {
        this.queueBulge(amount);
      }
    },
  };
}
