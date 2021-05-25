import { Body, Circle, vec2 } from "p2";
import snd_metalHittingRock from "../../../../resources/audio/impacts/metal_hitting_rock.flac";
import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import { SoundInstance } from "../../../core/sound/SoundInstance";
import { clamp, invLerp } from "../../../core/util/MathUtil";
import { rBool, rNormal, rUniform } from "../../../core/util/Random";
import { V, V2d } from "../../../core/Vector";
import { CollisionGroups } from "../../config/CollisionGroups";
import { getDiver } from "../../diver/Diver";
import { Harpoon } from "../../diver/harpoon/Harpoon";
import { Harpoonable } from "../../diver/harpoon/Harpoonable";
import { Bubble } from "../../effects/Bubble";
import { getWaves } from "../../environment/Waves";
import { SonarMarker } from "../../hud/sonar/SonarMarker";
import { SonarTarget } from "../../hud/sonar/SonarTarget";
import { GroundTile } from "../../plants/GroundTile";
import { getUpgradeManager } from "../../upgrade/UpgradeManager";
import { Boat } from "../Boat";
import DiveBellHarpoonConnection from "./DiveBellHarpoonConnection";
import { DiveBellPhysics } from "./DiveBellPhysics";
import { DiveBellSprite } from "./DiveBellSprite";
import { DiveBellTether } from "./DiveBellTether";

export const DIVE_BELL_RADIUS = 1;

/** Provides the diver with oxygen */
export class DiveBell extends BaseEntity implements Entity, Harpoonable {
  id = "diveBell";
  body: Body;

  constructor(position: V2d, boat: Boat) {
    super();

    this.body = new Body({
      mass: 1,
      position,
    });
    // regular collision shape
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.World,
      })
    );
    // smaller one for harpoon to stick in
    this.body.addShape(
      new Circle({
        radius: DIVE_BELL_RADIUS * 0.6,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.Harpoon,
        collisionResponse: false,
      })
    );

    this.addChild(new DiveBellSprite(this));
    this.addChild(new DiveBellTether(this, boat));
    this.addChild(new DiveBellPhysics(this));
    this.addChild(
      new SonarMarker(() => this.getPosition(), {
        color: 0xffff00,
        blipSize: 1.4,
      })
    );
  }

  getFillRate() {
    return 10;
  }

  onTick(dt: number) {
    const diver = getDiver(this.game!);
    if (diver && this.isActive()) {
      // TODO: Check distance to head
      const distance = vec2.distance(diver.getPosition(), this.getPosition());
      if (distance < DIVE_BELL_RADIUS + 2) {
        diver.air.giveOxygen(dt * this.getFillRate());
      }
    }
  }

  /** Return the current depth in meters under the surface */
  getDepth() {
    const waves = getWaves(this.game!);
    const [x, y] = this.body.position;
    const surfaceHeight = waves.getSurfaceHeight(x);

    return y - surfaceHeight;
  }

  /** Return the percent of the bell covered by water. */
  getPercentSubmerged(): number {
    const depth = this.getDepth();
    const percent = invLerp(-DIVE_BELL_RADIUS, DIVE_BELL_RADIUS, depth);
    return clamp(percent);
  }

  getMaxDepth(): number {
    const upgradeManager = getUpgradeManager(this.game!)!;
    if (upgradeManager.hasUpgrade("diveBellDepth2")) {
      return 800;
    } else if (upgradeManager.hasUpgrade("diveBellDepth1")) {
      return 200;
    } else {
      return 100;
    }
  }

  isActive() {
    return this.getPosition()[1] < this.getMaxDepth();
  }

  onSlowTick(dt: number) {
    if (this.isActive() && rBool(dt * 10)) {
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
      this.addChild(new DiveBellHarpoonConnection(this, harpoon));
    }
  }

  onImpact(other: Entity) {
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
