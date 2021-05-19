import { Body, Capsule } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { clamp, invLerp } from "../../core/util/MathUtil";
import { V, V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { getWaves } from "../environment/Waves";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { HarpoonGun } from "./weapons/HarpoonGun";
import { WorldAnchor } from "../world/loading/WorldAnchor";
import { BreatheEffect } from "./Breathing";
import { DiverPhysics } from "./DiverPhysics";
import { DiverSprite } from "./DiverSprite";
import { DiverSubmersion } from "./DiverSubmersion";
import { DiverVoice } from "./DiverVoice";
import { Flashlight } from "./Flashlight";
import GlowStick from "./Glowstick";
import { Inventory } from "./Inventory";
import { HARPOON_OXYGEN_COST, OxygenManager } from "./OxygenManager";

export const DIVER_HEIGHT = 2.0; // in meters
const WIDTH = 0.65; // in meters
const BASE_SPEED = 12.0; // Newtons?
const SPEED_PER_UPGRADE = 4.0; // Newtons?

export class Diver extends BaseEntity implements Entity {
  persistenceLevel = 1;
  id = "diver";
  body: Body;

  onBoat = true;
  isDead = false;

  harpoonGun: HarpoonGun;
  air: OxygenManager;
  inventory: Inventory;

  aimDirection: V2d = V(0, 1);
  moveDirection: V2d = V(0, 0);

  constructor(position: V2d = V(0, 0)) {
    super();

    this.harpoonGun = this.addChild(new HarpoonGun(this));
    this.air = this.addChild(new OxygenManager(this));
    this.inventory = this.addChild(new Inventory(this));
    this.addChild(new BreatheEffect(this));
    this.addChild(new DiverSubmersion(this));
    this.addChild(new Flashlight(this));
    this.addChild(new WorldAnchor(() => this.getPosition(), 80, 80));
    this.addChild(new DiverSprite(this));
    this.addChild(new DiverVoice(this));
    this.addChild(new DiverPhysics(this));

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });
    this.body.addShape(
      new Capsule({
        radius: WIDTH / 2,
        length: DIVER_HEIGHT - WIDTH,
        collisionGroup: CollisionGroups.Diver,
        collisionMask: CollisionGroups.All,
      }),
      [0, 0],
      Math.PI / 2
    );
  }

  getMaxSpeed(): number {
    const upgradeManager = getUpgradeManager(this.game!)!;

    let speed = BASE_SPEED;
    if (upgradeManager.hasUpgrade("flippers1")) {
      speed += SPEED_PER_UPGRADE;
    }
    if (upgradeManager.hasUpgrade("flippers2")) {
      speed += SPEED_PER_UPGRADE;
    }

    return speed;
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
    return clamp(invLerp(-DIVER_HEIGHT / 2, DIVER_HEIGHT / 2, depth));
  }

  isSurfaced() {
    return this.getPercentSubmerged() < 0.7;
  }

  isSubmerged() {
    return !this.isSurfaced();
  }

  onTick(dt: number) {}

  jump() {
    if (this.onBoat) {
      this.onBoat = false;
      this.body.applyImpulse(V(1.6, -2));
      this.body.collisionResponse = true;
      this.game?.dispatch({ type: "diverJumped" });
    }
  }

  damage(amount: number) {
    this.game?.dispatch({ type: "diverHurt", amount });
  }

  shoot() {
    if (!this.onBoat && this.air.currentOxygen > HARPOON_OXYGEN_COST) {
      this.harpoonGun.shoot(this.aimDirection);
    }
  }

  retract() {
    if (!this.onBoat) {
      this.harpoonGun.retract();
    }
  }

  throwGlowstick() {
    this.game!.addEntity(
      new GlowStick(
        this.getPosition(),
        this.aimDirection.add(this.body.velocity)
      )
    );
  }

  handlers = {
    diverDied: () => {
      this.isDead = true;
      console.log("I am dead");
    },

    diveStart: () => {
      this.isDead = false;
    },
  };
}

export function getDiver(game: Game | undefined): Diver | undefined {
  return game?.entities.getById("diver") as Diver;
}
