import { Graphics } from "@pixi/graphics";
import { vec2 } from "p2";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { clamp } from "../../../core/util/MathUtil";
import { V, V2d } from "../../../core/Vector";
import { getDiver } from "../../diver/Diver";

interface Attractor {
  position: V2d;
  strength: number;
  radius: number;
}

export class School extends BaseEntity implements Entity {
  private fish: FlockingFish[] = [];

  center: V2d = V(0, 0);
  velocity: V2d = V(0, 0);
  attractors: Attractor[] = [];

  constructor(fish: FlockingFish[] = [], public home?: V2d) {
    super();

    for (const f of fish) {
      this.addFish(f);
    }
  }

  addFish(fish: FlockingFish) {
    this.fish.push(fish);
    fish.joinSchool(this);
  }

  removeFish(fish: FlockingFish) {
    const index = this.fish.indexOf(fish);
    if (index >= 0) {
      this.fish.splice(index, 1);
    }
  }

  getNumFish(): number {
    return this.fish.length;
  }

  onTick(dt: number) {
    this.center.set(0, 0);
    this.velocity.set(0, 0);

    for (const fish of this.fish) {
      const fishEntity = (fish as any) as Entity;
      if (!fishEntity.game) {
        this.removeFish(fish);
      }
    }
    for (const fish of this.fish) {
      this.center.iadd(fish.getPosition());
      this.velocity.iadd(fish.getVelocity());
    }

    if (this.fish.length > 0) {
      this.center.imul(1.0 / this.fish.length);
      this.velocity.imul(1.0 / this.fish.length);
    }

    // Keep it below the surface
    this.center[1] = Math.max(2, this.center[1]);

    if (this.home) {
      const [hx, hy] = this.home;
      this.center[0] = clamp(this.center[0], hx - 10, hx + 10);
      this.center[1] = clamp(this.center[1], hy - 10, hy + 10);

      this.center.ilerp(this.home, dt * 0.1);
    }

    const diver = getDiver(this.game);
    if (diver && diver.isSubmerged()) {
      this.attractors = [
        {
          position: diver.getPosition(),
          strength: -30,
          radius: 5,
        },

        {
          position: diver.getPosition(),
          strength: 4,
          radius: 15,
        },
      ];
    }
  }

  getNeighbors(pos: V2d, maxDistance = 1): FlockingFish[] {
    const neighbors = [];
    for (const fish of this.fish) {
      if (vec2.distance(pos, fish.getPosition()) < maxDistance) {
        neighbors.push(fish);
      }
    }
    return neighbors;
  }
}

export interface FlockingFish {
  getPosition(): V2d;
  getVelocity(): V2d;
  joinSchool: (school: School) => void;
}

class SchoolDebugView extends BaseEntity implements Entity {
  sprite = new Graphics();

  constructor(private school: School) {
    super();
  }

  onRender() {
    const [cx, cy] = this.school.center;
    const [vx, vy] = this.school.velocity;

    this.sprite.clear();

    this.sprite.beginFill(0xff0000);
    this.sprite.drawCircle(0, 0, 2);
    this.sprite.endFill();

    this.sprite.lineStyle({ width: 0.1, color: 0xffff00 });
    this.sprite.moveTo(0, 0);
    this.sprite.lineTo(vx * 8, vy * 8);

    this.sprite.position.set(cx, cy);
    this.sprite.scale.set(1 / 8);
  }
}
