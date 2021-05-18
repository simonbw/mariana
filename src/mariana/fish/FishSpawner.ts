import { Graphics } from "@pixi/graphics";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { rBool } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import {
  TileLoadListener,
  TileUnloadListener,
} from "../world/loading/OnLoader";
import { getWorldMap } from "../world/WorldMap";

export class FishSpawner extends BaseEntity implements Entity {
  constructor(
    private position: V2d,
    private spawnFish: (game: Game) => void,
    private getFishCount: (game: Game) => number,
    private targetNumber = 1,
    private spawnRate = 0.1,
    private makeupTime: number = 0
  ) {
    super();

    const graphics = new Graphics();
    graphics.beginFill(0xff0000);
    graphics.drawCircle(0, 0, 2.0);
    graphics.endFill();
    graphics.scale.set(1 / 4);
    graphics.position.set(...position);

    this.sprite = graphics;

    this.sprite.visible = false;
  }

  onAdd(game: Game) {
    const tilePos = getWorldMap(game)!.worldToTile(this.position);
    this.addChild(
      new TileUnloadListener(tilePos, (game) => {
        const unloadTime = game.elapsedUnpausedTime;
        game.addEntity(
          new TileLoadListener(tilePos, (game) => {
            const loadTime = game.elapsedUnpausedTime;
            game.addEntity(
              new FishSpawner(
                this.position,
                this.spawnFish,
                this.getFishCount,
                this.targetNumber,
                this.spawnRate,
                loadTime - unloadTime
              )
            );
          })
        );
        this.destroy();
      })
    );
  }

  onSlowTick(dt: number) {
    if (this.makeupTime) {
      this.makeupTime = 0;
      dt += this.makeupTime;
    }
    if (rBool(dt * this.spawnRate)) {
      const fishCount = this.getFishCount(this.game!);
      if (fishCount < this.targetNumber) {
        if (!this.isOnScreen()) {
          this.spawnFish(this.game!);
        }
      }
    }
  }

  isOnScreen() {
    const viewport = this.game!.camera.getWorldViewport();
    return viewport.containsPoint(this.position, 2);
  }

  onRender() {
    this.sprite!.alpha = this.isOnScreen() ? 0.5 : 1.0;
  }
}
