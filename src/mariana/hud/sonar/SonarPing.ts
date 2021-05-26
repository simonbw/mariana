import { vec2 } from "p2";
import { Graphics } from "pixi.js";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { polarToVec } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { getWorldMap } from "../../world/WorldMap";
import { PingParticle } from "./Sonar";
import { getSonarTargets, SonarTarget } from "./SonarTarget";

const PING_PARTICLES = 128;
const PING_SPEED = 60.0; // m/s
const PING_LIFESPAN = 1.75; // seconds

interface ReachedTarget {
  position: V2d;
  blipSize: number;
  color: number;
}

/** A single ping */
export class SonarPing extends BaseEntity implements Entity {
  sonarSprite: Graphics;

  pings: PingParticle[] = [];
  targetsRemaining: Set<SonarTarget> = new Set();
  targetsReached: ReachedTarget[] = [];
  pingRadius: number = 0;

  constructor(worldPosition: V2d) {
    super();
    this.sonarSprite = new Graphics();

    this._position.set(worldPosition);

    const n = PING_PARTICLES;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n;
      this.pings.push({
        position: worldPosition.clone(),
        velocity: polarToVec(angle, PING_SPEED),
        stopped: false,
      });
    }
  }

  async onAdd(game: Game) {
    for (const target of getSonarTargets(game)) {
      this.targetsRemaining.add(target);
    }
    await this.wait(PING_LIFESPAN, (dt, t) => {
      this.sonarSprite.alpha = 1.0 - t ** 2;
    });
    this.destroy();
  }

  // to avoid allocations
  private _v = V(0, 0);
  onTick(dt: number) {
    const worldMap = getWorldMap(this.game!)!;
    for (const ping of this.pings) {
      if (!ping.stopped) {
        const tile = worldMap.worldToTile(ping.position);
        if (worldMap.groundMap.tileIsSolid(tile)) {
          ping.stopped = true;
        } else {
          const v = this._v.set(ping.velocity).imul(dt);
          ping.position.iadd(v);
        }
      }
    }
  }

  onSlowTick(dt: number) {
    this.pingRadius += dt * PING_SPEED;

    for (const target of this.targetsRemaining) {
      const pos = target.getPosition();
      const distance = vec2.distance(pos, this.getPosition());
      if (distance < this.pingRadius) {
        this.targetsRemaining.delete(target);
        this.targetsReached.push({
          position: pos.clone(),
          blipSize: target.blipSize,
          color: target.color,
        });
      }
    }
  }

  onRender(dt: number) {
    this.sonarSprite.clear();

    const first = this.pings[0].position;
    this.sonarSprite.moveTo(first[0], first[1]);
    for (let i = 1; i < this.pings.length; i++) {
      const lastPing = this.pings[i - 1];
      const ping = this.pings[i];
      const isSolid = ping.stopped && lastPing.stopped;
      const isEdge = ping.stopped != lastPing.stopped;
      const [x, y] = this.pings[i].position;

      const dist = vec2.dist(lastPing.position, ping.position);

      let alpha = isSolid ? 1.0 : 0.7;
      if (dist > 10.0) {
        alpha = 0;
      }
      if (isEdge) {
        alpha = 0;
      }
      if (y < 0 || lastPing.position.y < 0) {
        alpha = 0;
      }

      this.sonarSprite.lineStyle({
        width: isSolid ? 0.5 : 0.2,
        color: isSolid ? 0x00ff00 : 0x00ff00,
        alpha,
      });
      this.sonarSprite.lineTo(x, y);

      // if (ping.stopped) {
      //   this.sonarSprite.beginFill(0x00ff00, 0.3);
      //   this.sonarSprite.drawCircle(x, y, 0.2);
      //   this.sonarSprite.endFill();
      // }
    }
    this.sonarSprite.lineTo(first[0], first[1]);

    for (const target of this.targetsReached) {
      const [x, y] = target.position;
      this.sonarSprite.lineStyle();
      this.sonarSprite.beginFill(target.color, 0.4);
      this.sonarSprite.drawCircle(x, y, target.blipSize);
      this.sonarSprite.endFill();
      this.sonarSprite.beginFill(target.color, 0.4);
      this.sonarSprite.drawCircle(x, y, target.blipSize / 2);
      this.sonarSprite.endFill();
    }
  }

  onDestroy() {
    this.sonarSprite.parent?.removeChild(this.sonarSprite);
  }
}
