import { Graphics } from "@pixi/graphics";
import type BezierClass from "bezier-js";
import { Body, DistanceConstraint } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { clamp } from "../../../core/util/MathUtil";
import { V } from "../../../core/Vector";
import { Layer } from "../../config/layers";
import { Boat, getBoat } from "../Boat";
import { DiveBell } from "./DiveBell";
const Bezier = require("bezier-js") as typeof BezierClass;

export class DiveBellTether extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;
  constraints: DistanceConstraint[] = [];
  bodies: Body[] = [];
  private controlPoint = V(0, 0);

  constructor(private diveBell: DiveBell, private boat: Boat) {
    super();

    this.sprite = new Graphics();
    this.sprite.layerName = Layer.WORLD_BACK;
  }

  onAdd(game: Game) {
    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = this.boat.getPosition();
    this.controlPoint.set((bellX + boatX) / 2, (bellY + boatY) / 2);
  }

  onTick(dt: number) {}

  onRender(dt: number) {
    this.sprite.clear();
    this.sprite.lineStyle({ width: 0.2, color: 0x004400 });
    const [bellX, bellY] = this.diveBell.getPosition();
    const [boatX, boatY] = getBoat(this.game)!.getPosition();

    this.controlPoint.ilerp([(bellX + boatX) / 2, bellY], clamp(dt));

    const [cx, cy] = this.controlPoint;

    const curve = new Bezier([bellX, bellY, cx, cy, boatX, boatY]);

    this.sprite.moveTo(bellX, bellY);
    for (const point of curve.getLUT(100)) {
      this.sprite.lineTo(point.x, point.y);
    }

    this.sprite.lineTo(boatX, boatY);
  }
}
