import { AnimatedSprite } from "@pixi/sprite-animated";
import img_anemone1 from "../../../resources/images/flora/anemone-1.png";
import img_anemone2 from "../../../resources/images/flora/anemone-2.png";
import img_anemone3 from "../../../resources/images/flora/anemone-3.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { rBool } from "../../core/util/Random";
import { V, V2d } from "../../core/Vector";
import { Layer } from "../config/layers";
import { ClownFish } from "../fish/passive/ClownFish";
import { School } from "../fish/fish-systems/School";

const SIZE = 1.5;
const SPAWN_RATE = 0.5; // per second
const MAX_FISH = 8;

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

  onAdd() {
    this.spawnFish();
    this.spawnFish();
    this.spawnFish();
    this.spawnFish();
  }

  onSlowTick(dt: number) {
    if (this.school.getNumFish() < MAX_FISH && rBool(dt * SPAWN_RATE)) {
      this.spawnFish();
    }
  }

  spawnFish() {
    const fish = new ClownFish(this.position);
    this.game!.addEntity(fish);
    this.school.addFish(fish);
  }

  onRender(dt: number) {
    this.sprite.update(dt);
  }
}
