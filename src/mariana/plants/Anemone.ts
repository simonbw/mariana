import { AnimatedSprite } from "@pixi/sprite-animated";
import img_anemone1 from "../../../resources/images/flora/anemone-1.png";
import img_anemone2 from "../../../resources/images/flora/anemone-2.png";
import img_anemone3 from "../../../resources/images/flora/anemone-3.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import Game from "../../core/Game";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { School } from "../fish/fish-systems/School";
import { ClownFish } from "../fish/passive/ClownFish";
import {
  TileLoadListener,
  TileUnloadListener,
} from "../world/loading/OnLoader";
import { getWorldMap } from "../world/WorldMap";

const SIZE = 1.5;
const SPAWN_RATE = 0.2; // per second
const MAX_FISH = 7;

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
    // TODO: Spawn number of fish based on how many since last time
    this.spawnFish();
    this.spawnFish();
    this.spawnFish();
    this.spawnFish();

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
    if (this.school.getNumFish() < MAX_FISH && rBool(dt * SPAWN_RATE)) {
      this.spawnFish();
    }
  }

  spawnFish() {
    const fish = new ClownFish(this.position.sub([0, 0.5]));
    this.game!.addEntity(fish);
    this.school.addFish(fish);
  }

  onRender(dt: number) {
    this.sprite.update(dt);
  }
}
