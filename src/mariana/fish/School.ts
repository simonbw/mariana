import { Graphics } from "@pixi/graphics";
import { vec2 } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { V, V2d } from "../../core/Vector";
import { getDiver } from "../diver/Diver";

interface Attractor {
  position: V2d;
  strength: number;
}

export class School extends BaseEntity implements Entity {
  fish: FlockingFish[] = [];
  center: V2d = V(0, 0);
  velocity: V2d = V(0, 0);
  attractors: Attractor[] = [];

  constructor(fish: FlockingFish[] = []) {
    super();

    for (const f of fish) {
      this.addFish(f);
    }

    // this.addChild(new SchoolDebugView(this));
  }

  addFish(fish: FlockingFish) {
    this.fish.push(fish);
    fish.school = this;
  }

  onTick() {
    this.center.set(0, 0);
    this.velocity.set(0, 0);

    for (const fish of this.fish) {
      this.center.iadd(fish.getPosition());
      this.velocity.iadd(fish.getVelocity());
    }

    if (this.fish.length > 0) {
      this.center.imul(1.0 / this.fish.length);
      this.velocity.imul(1.0 / this.fish.length);
    }

    // TODO: Sort fish?

    // Keep it below the surface
    this.center[1] = Math.max(2, this.center[1]);

    const diver = getDiver(this.game!)!;
    if (diver) {
      const diverPos = diver.getPosition();
      this.center.ilerp(diverPos, 0.5);
    }
  }

  // TODO: Don't allocate?
  getNeighbors(pos: V2d, distance = 1): FlockingFish[] {
    const neighbors = [];
    for (const fish of this.fish) {
      if (vec2.distance(pos, fish.getPosition()) < distance) {
        neighbors.push(fish);
      }
    }
    return neighbors;
  }
}

export interface FlockingFish {
  getPosition(): V2d;
  getVelocity(): V2d;
  school: School | undefined;
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
