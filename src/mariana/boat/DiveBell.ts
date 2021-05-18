import { Graphics } from "@pixi/graphics";
import { Sprite } from "@pixi/sprite";
import { Body, Circle, LockConstraint, vec2 } from "p2";
import snd_metalHittingRock from "../../../resources/audio/impacts/metal_hitting_rock.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { angleDelta, clamp, invLerp, lerp } from "../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { Layer } from "../config/layers";
import { getDiver } from "../diver/Diver";
import { Bubble } from "../effects/Bubble";
import { getWaves } from "../environment/Waves";
import { PointLight } from "../lighting/PointLight";
import { GroundTile } from "../plants/GroundTile";
import { Harpoon } from "../weapons/Harpoon";
import { Harpoonable } from "../weapons/Harpoonable";

const RADIUS = 1;
const DRAG = 10.0;

export class DiveBell extends BaseEntity implements Entity, Harpoonable {
  id = "diveBell";
  sprite: Sprite & GameSprite;
  body: Body;
  lights: PointLight[];

  constructor(position: V2d) {
    super();

    this.body = new Body({
      mass: 1,
      position,
    });
    this.body.addShape(
      new Circle({
        radius: RADIUS,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.World,
      })
    );
    this.body.addShape(
      new Circle({
        radius: RADIUS * 0.6,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.Harpoon,
        collisionResponse: false,
      })
    );

    const upscale = 4;
    const graphics = new Graphics();
    graphics.lineStyle({ width: 0.1 * upscale, color: 0x444400 });
    graphics.beginFill(0xffff00);
    graphics.drawCircle(0, 0, RADIUS * upscale);
    graphics.endFill();
    graphics.lineStyle();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, 0, (RADIUS / 2) * upscale);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, -(RADIUS / 2) * upscale, (RADIUS / 8) * upscale);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(0, (RADIUS / 2) * upscale, (RADIUS / 8) * upscale);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle(-(RADIUS / 2) * upscale, 0, (RADIUS / 8) * upscale);
    graphics.endFill();
    graphics.beginFill(0x444400);
    graphics.drawCircle((RADIUS / 2) * upscale, 0, (RADIUS / 8) * upscale);
    graphics.endFill();
    graphics.scale.set(1 / upscale);

    this.sprite = new Sprite();
    this.sprite.addChild(graphics);
    this.sprite.layerName = Layer.WORLD_BACK;

    this.lights = [new PointLight({ size: 2, intensity: 3 })];
  }

  getFillRate() {
    return 10;
  }

  onTick(dt: number) {
    const diver = getDiver(this.game!);

    if (diver) {
      // TODO: Check distance to head
      const direction = diver.getPosition().sub(this.getPosition());
      if (direction.magnitude < RADIUS + 2) {
        diver.air.giveOxygen(dt * this.getFillRate());
      }
    }

    this.applyPhysics(dt);
  }

  /** Return the current depth in meters under the surface */
  getDepth() {
    const waves = getWaves(this.game!);
    const x = this.body.position[1];
    const surfaceHeight = waves.getSurfaceHeight(x);

    return this.body.position[1] - surfaceHeight;
  }

  getPercentSubmerged(): number {
    const depth = this.getDepth();
    return clamp(invLerp(-RADIUS, RADIUS, depth));
  }

  private _physics = V(0, 0);
  applyPhysics(dt: number) {
    const percentSubmerged = this.getPercentSubmerged();

    // drag
    const drag = lerp(DRAG, DRAG * 0.1, percentSubmerged);
    this._physics.set(this.body.velocity).imul(-drag);

    // gravity
    const g = lerp(9.8, 0, percentSubmerged);
    this._physics.iadd([0, g * this.body.mass]);

    this.body.applyForce(this._physics);

    this.body.angularVelocity *= Math.exp(-dt * 0.3);

    this.body.angularVelocity += -0.1 * angleDelta(this.body.angle, 0) * dt;
  }

  // TODO: Tether to boat
  onRender(dt: number) {
    this.sprite.position.set(...this.body.position);
    this.sprite.rotation = this.body.angle;

    if (rBool(dt * 10)) {
      this.game!.addEntity(
        new Bubble(
          this.getPosition().iadd([rNormal(), rNormal()]),
          V(rNormal(), rNormal()),
          rUniform(0.3, 0.6)
        )
      );
    }
  }

  onHarpooned(harpoon: Harpoon) {
    if (harpoon.getDamageAmount() > 0) {
      this.addChild(new BuoyHarpoonTether(this, harpoon));
    }
  }

  onBeginContact(other: Entity) {
    if (other instanceof GroundTile) {
      const gain = clamp(vec2.length(this.body.velocity) / 8) / 8;
      this.game!.addEntity(
        new SoundInstance(snd_metalHittingRock, {
          gain,
          speed: rUniform(0.7, 0.9),
        })
      );
    }
  }
}

export class BuoyHarpoonTether extends BaseEntity implements Entity {
  constructor(private buoy: DiveBell, private harpoon: Harpoon) {
    super();

    this.constraints = [new LockConstraint(buoy.body, harpoon.body)];
  }

  onTick() {
    const gun = this.harpoon.harpoonGun;
    if (gun.tether?.retracting && gun.tether.retractPercent >= 1.0) {
      this.destroy();
    } else {
      // ?
    }
  }
}
