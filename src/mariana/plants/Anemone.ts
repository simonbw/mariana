import { AnimatedSprite } from "@pixi/sprite-animated";
import img_anemone1 from "../../../resources/images/flora/anemone-1.png";
import img_anemone2 from "../../../resources/images/flora/anemone-2.png";
import img_anemone3 from "../../../resources/images/flora/anemone-3.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { range } from "../../core/util/FunctionalUtils";
import { lerp } from "../../core/util/MathUtil";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { getTimeOfDay } from "../environment/TimeOfDay";
import { School } from "../fish/fish-systems/School";
import { ClownFish } from "../fish/passive/ClownFish";
import {
  TileLoadListener,
  TileUnloadListener,
} from "../world/loading/OnLoader";
import { getWorldMap } from "../world/WorldMap";

const SIZE = 1.5;
const SPAWN_RATE = 0.2; // per second
const MAX_SCHOOL_SIZE = 7;
const MAX_FISH = 20;

/** Spawns clownfish */
export class Anemone extends BaseEntity implements Entity {
  sprite: AnimatedSprite & GameSprite;
  school: School;

  private spawnPosition: V2d;

  constructor(public position: V2d) {
    super();

    this.sprite = AnimatedSprite.fromImages([
      img_anemone1,
      img_anemone2,
      img_anemone3,
      img_anemone2,
    ]);

    this.spawnPosition = position.add([0, -0.4]);

    this.sprite.autoUpdate = false;
    this.sprite.animationSpeed = 2;
    this.sprite.play();

    this.sprite.width = SIZE;
    this.sprite.height = SIZE;

    this.sprite.anchor.set(0.5, 1);
    this.sprite.position.set(...position);
    this.sprite.layerName = Layer.WORLD_FRONT;

    this.school = this.addChild(new School([], this.position));
  }

  onAdd(game: Game) {
    const n = Math.floor(4 * getTimeOfDay(this.game!).getDayPercent());
    for (let i = 0; i < n; i++) {
      this.spawnFish();
    }

    const tilePos = getWorldMap(game)!.worldToTile(this.position);
    this.addChild(
      new TileUnloadListener(tilePos, (game) => {
        this.unload(game);
      })
    );
  }

  unload(game: Game) {
    const tilePos = getWorldMap(game)!.worldToTile(this.position);
    game.addEntity(
      new TileLoadListener(tilePos, (game) => {
        game.addEntity(new Anemone(this.position));
      })
    );
    this.destroy();
  }

  onSlowTick(dt: number) {
    const spawnRate = SPAWN_RATE * getTimeOfDay(this.game!).getDayPercent();
    if (
      rBool(dt * spawnRate) &&
      this.school.getNumFish() < MAX_SCHOOL_SIZE &&
      this.game!.entities.getTagged("clownfish").length < MAX_FISH
    ) {
      this.spawnFish();
    }
  }

  spawnFish() {
    const fish = new ClownFish(this.spawnPosition);
    this.game!.addEntity(fish);
    this.school.addFish(fish);
  }

  onRender(dt: number) {
    this.sprite.update(dt);
  }
}
