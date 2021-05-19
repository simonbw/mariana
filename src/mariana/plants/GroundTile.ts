import { Body, Box, vec2 } from "p2";
import snd_metalHittingRock from "../../../resources/audio/impacts/metal_hitting_rock.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { clamp } from "../../core/util/MathUtil";
import { rUniform } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { CollisionGroups } from "../config/CollisionGroups";
import { TILE_SIZE_METERS } from "../constants";
import { Harpoon } from "../diver/weapons/Harpoon";
import { Harpoonable } from "../diver/weapons/Harpoonable";

export class GroundTile extends BaseEntity implements Entity, Harpoonable {
  persistenceLevel = 1;

  constructor(position: V2d) {
    super();

    this.body = new Body({ mass: 0, position: position.clone() });
    this.body.addShape(
      new Box({
        width: TILE_SIZE_METERS,
        height: TILE_SIZE_METERS,
        collisionGroup: CollisionGroups.World,
        collisionMask: CollisionGroups.All,
      })
    );
  }

  onHarpooned(harpoon: Harpoon) {
    const gain = clamp(vec2.length(harpoon.body.velocity) / 12) / 10;
    this.game!.addEntity(
      new SoundInstance(snd_metalHittingRock, {
        gain,
        speed: rUniform(0.9, 1.1),
      })
    );
  }
}
