import { Body, Box, vec2 } from "p2";
import { Sprite } from "pixi.js";
import img_harpoon from "../../../resources/images/diver/harpoon.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { clamp, polarToVec } from "../../core/util/MathUtil";
import { rBool, rDirection, rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Bubble } from "../effects/Bubble";
import { SurfaceSplash } from "../effects/SurfaceSplash";
import { getWaves } from "../environment/Waves";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { isHarpoonable } from "./Harpoonable";
import { HarpoonGun, SIZE } from "./HarpoonGun";

const MIN_SPEED_FOR_DAMAGE = 5; // meters/second
const FRICTION = 0.04;

export class Harpoon extends BaseEntity implements Entity {
  body: Body;
  sprite: Sprite & GameSprite;
  minSpeed = Infinity;

  wasSurfaced: boolean = false;

  constructor(
    position: V2d,
    public velocity: V2d,
    public harpoonGun: HarpoonGun
  ) {
    super();

    const sprite = (this.sprite = Sprite.from(img_harpoon));
    sprite.width = SIZE;
    sprite.height = SIZE;
    sprite.rotation = velocity.angle;
    sprite.anchor.set(0.5);

    this.body = new Body({
      mass: 0.03,
      position,
    });
    this.body.addShape(
      new Box({
        width: SIZE,
        height: 0.2,
        collisionGroup: CollisionGroups.Harpoon,
        collisionMask: CollisionGroups.World | CollisionGroups.Fish,
      })
    );
    this.body.velocity = velocity;
    this.body.angle = velocity.angle;
    this.body.angularDamping = 0.12;
  }

  onAdd(game: Game) {
    const [x, y] = this.body.position;
    this.wasSurfaced = getWaves(game).getSurfaceHeight(x) > y;
  }

  getVelocity(): V2d {
    return V(this.body.velocity);
  }

  onTick() {
    const [x, y] = this.body.position;
    const isSurfaced = getWaves(this.game!).getSurfaceHeight(x) > y;

    if (isSurfaced != this.wasSurfaced) {
      const speed = vec2.length(this.body.velocity);
      this.game!.addEntity(new SurfaceSplash(x, speed / 5, 20));
    }

    this.body.applyForce([0, 9.8 * this.body.mass]);
    if (!isSurfaced) {
      this.body.applyForce(V(this.body.velocity).imul(-FRICTION));

      const bubbleChance = clamp((this.minSpeed / 40) ** 2);
      if (rBool(bubbleChance)) {
        this.game!.addEntity(
          new Bubble(
            this.getPosition().iadd(
              polarToVec(rDirection(), rUniform(0, 0.15))
            ),
            V(rNormal(), rNormal()),
            rUniform(0.1, 0.2 + 0.2 * bubbleChance)
          )
        );
      }
    }

    this.wasSurfaced = isSurfaced;
    this.minSpeed = Math.min(this.minSpeed, vec2.length(this.body.velocity));
  }

  onRender() {
    this.sprite.position.set(...this.body!.position);
    this.sprite.rotation = this.body.angle - Math.PI / 4;
  }

  onBeginContact(other: Entity) {
    // harpoon other stuff
    if (isHarpoonable(other)) {
      other.onHarpooned(this);
    }
  }

  getDamageAmount(): number {
    const speed = getUpgradeManager(this.game!).hasUpgrade("doubleEndedPoon")
      ? vec2.length(this.body.velocity)
      : this.minSpeed;
    if (speed < MIN_SPEED_FOR_DAMAGE) {
      return 0;
    } else {
      return 10;
    }
  }
}
