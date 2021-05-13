import { Body, Capsule } from "p2";
import snd_dialogHelmetPain1 from "../../../resources/audio/dialog/dialog_helmet_pain1.flac";
import snd_dialogHelmetPain2 from "../../../resources/audio/dialog/dialog_helmet_pain2.flac";
import snd_dialogHelmetPain3 from "../../../resources/audio/dialog/dialog_helmet_pain3.flac";
import snd_dialogHelmetPain4 from "../../../resources/audio/dialog/dialog_helmet_pain4.flac";
import snd_dialogHelmetPain5 from "../../../resources/audio/dialog/dialog_helmet_pain5.flac";
import snd_dialogHelmetPain6 from "../../../resources/audio/dialog/dialog_helmet_pain6.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { V, V2d } from "../../core/Vector";
import { Boat } from "../Boat";
import { CollisionGroups } from "../config/CollisionGroups";
import { getWaves } from "../effects/Waves";
import { getUpgradeManager } from "../upgrade/UpgradeManager";
import { ShuffleRing } from "../utils/ShuffleRing";
import { HarpoonGun } from "../weapons/HarpoonGun";
import { WorldAnchor } from "../world/WorldAnchor";
import { BreatheEffect } from "./Breathing";
import { DiverSprite } from "./DiverSprite";
import { DiverSubmersion } from "./DiverSubmersion";
import { Flashlight } from "./Flashlight";
import GlowStick from "./Glowstick";
import { Inventory } from "./Inventory";
import { HARPOON_OXYGEN_COST, OxygenManager } from "./OxygenManager";

export const DIVER_HEIGHT = 2.0; // in meters
const WIDTH = 0.65; // in meters
const BASE_SPEED = 12.0; // Newtons?
const SPEED_PER_UPGRADE = 4.0; // Newtons?
const WATER_FRICTION = 2.2; // Water friction
const SURFACE_GRAVITY = 9.8; // meters / second^2
const SUBMERGED_GRAVITY = 0; //5.0; // meters / second^2
const HEAD_OFFSET = -0.35; // meters offset from center for head to be submerged
const MAX_WAVE_FORCE = 3; // multiplier of wave velocity
const WAVE_DEPTH_FACTOR = 0.95; // multiplier of wave velocity

const HURT_SOUNDS = new ShuffleRing([
  snd_dialogHelmetPain1,
  snd_dialogHelmetPain2,
  snd_dialogHelmetPain3,
  snd_dialogHelmetPain4,
  snd_dialogHelmetPain5,
  snd_dialogHelmetPain6,
]);

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

    this.body = new Body({
      mass: 1,
      position: position.clone(),
      fixedRotation: true,
    });
    const shape = new Capsule({
      radius: WIDTH / 2,
      length: DIVER_HEIGHT - WIDTH,
      collisionGroup: CollisionGroups.Diver,
      collisionMask: CollisionGroups.All,
    });
    this.body.addShape(shape, [0, 0], Math.PI / 2);
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

  // Return the current depth in meters under the surface
  getDepth() {
    const waves = getWaves(this.game!);
    const x = this.body.position[1];
    const surfaceHeight = waves.getSurfaceHeight(x);

    return this.body.position[1] - surfaceHeight;
  }

  isSurfaced() {
    return this.getDepth() + HEAD_OFFSET <= 0;
  }

  isSubmerged() {
    return !this.isSurfaced();
  }

  onTick(dt: number) {
    if (this.onBoat) {
      const boat = this.game!.entities.getById("boat") as Boat;
      const [x, y] = boat.getLaunchPosition();
      this.body.position[0] = x;
      this.body.position[1] = y;
      this.body.velocity[0] = 0;
      this.body.velocity[1] = 0;
      this.body.collisionResponse = false;
    } else {
      const g = this.isSurfaced() ? SURFACE_GRAVITY : SUBMERGED_GRAVITY;
      this.body.applyForce([0, this.body.mass * g]);

      if (!this.isSurfaced()) {
        if (!this.isDead) {
          this.body.applyForce(this.moveDirection.mul(this.getMaxSpeed()));
        }
        this.body.applyForce(V(this.body.velocity).imul(-WATER_FRICTION));

        // Wave forces
        const waves = getWaves(this.game!);
        const x = this.body.position[0];
        const surfaceVelocity = waves.getSurfaceVelocity(x);
        const d = this.getDepth() - HEAD_OFFSET;
        const depthFactor = WAVE_DEPTH_FACTOR ** d;
        this.body.applyImpulse(
          surfaceVelocity.imul(MAX_WAVE_FORCE * depthFactor * dt)
        );
      }
    }
  }

  jump() {
    if (this.onBoat) {
      this.onBoat = false;
      this.body.applyImpulse(V(1.6, -2));
      this.body.collisionResponse = true;
      this.game?.dispatch({ type: "diverJumped" });
    }
  }

  damage(amount: number) {
    this.game?.addEntity(
      new SoundInstance(HURT_SOUNDS.getNext(), { gain: 0.5 })
    );

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

export function getDiver(game?: Game): Diver | undefined {
  return game?.entities.getById("diver") as Diver;
}
