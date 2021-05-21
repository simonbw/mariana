import { Sprite } from "@pixi/sprite";
import img_bubble from "../../../../resources/images/particles/bubble.png";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../../core/entity/Entity";
import { invLerp } from "../../../core/util/MathUtil";
import { rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { Undertow } from "./Undertow";

const PARTICLE_DENSITY = 0.05;
const PARTICLE_SPEED = 0.3;

interface UndertowParticle {
  position: V2d;
  sprite: Sprite;
}

export class UndertowSprite extends BaseEntity implements Entity {
  particles: UndertowParticle[] = [];
  sprites: (Sprite & GameSprite)[] = [];

  constructor(private current: Undertow) {
    super();
  }

  onAdd() {
    const { width, height, strength } = this.current;
    const n = Math.floor(width * height * strength * PARTICLE_DENSITY);

    for (let i = 0; i < n; i++) {
      const sprite = Sprite.from(img_bubble);
      sprite.width = sprite.height = 0.2;
      const [cx, cy] = this.current.getPosition();
      const x = rNormal(cx, width * 0.55);
      const y = rUniform(cy - height / 2, cy + height / 2);
      const particle: UndertowParticle = {
        position: V(x, y),
        sprite,
      };
      this.particles.push(particle);
      this.sprites.push(sprite);
    }
  }

  onRender(dt: number) {
    const [cx, cy] = this.current.getPosition();
    const topY = cy - this.current.height / 2;
    const bottomY = cy + this.current.height / 2;

    for (const { position, sprite } of this.particles) {
      if (position.y > bottomY) {
        position[0] = rNormal(cx, this.current.width * 0.55);
        position[1] = topY;
      }

      if (position.y < topY + 1) {
        sprite.alpha = invLerp(topY, topY + 1, position.y);
      } else if (position.y > bottomY - 1) {
        sprite.alpha = invLerp(bottomY, bottomY - 1, position.y);
      } else {
        sprite.alpha = 1;
      }

      const [dx, dy] = this.current.getVelocityAt(position);
      position.iadd([dx * dt * PARTICLE_SPEED, dy * dt * PARTICLE_SPEED]);

      sprite.position.set(...position);
    }
  }
}
