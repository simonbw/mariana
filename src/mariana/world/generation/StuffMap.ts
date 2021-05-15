import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import Grid from "../../../core/util/Grid";
import { rInteger, shuffle } from "../../../core/util/Random";
import { TilePos } from "../../../core/util/TilePos";
import { TILE_SIZE_METERS } from "../../constants";
import { FishSpawner } from "../../fish/FishSpawner";
import { Anemone } from "../../plants/Anemone";
import { Seaweed } from "../../plants/Seaweed";
import { WorldMap } from "../WorldMap";

type LoadFunction = (game: Game) => Entity[];

export default class GroundMap {
  private loaderMap: Grid<LoadFunction[]> = new Grid();

  constructor(private worldMap: WorldMap) {
    this.makeSurfaceStuff();
    // this.makeDeeperStuff();
  }

  makeSurfaceStuff() {
    const available: number[] = [];
    for (let x = this.worldMap.minX; x < this.worldMap.maxX; x++) {
      available.push(x);
    }
    shuffle(available);

    const totalAnemonies = Math.floor(available.length * 0.1);
    for (let i = 0; i < totalAnemonies; i++) {
      const tx = available.pop()!;
      const ty = this.worldMap.groundMap.getHighestTile(tx) - 1;
      const worldPos = this.worldMap
        .tileToWorld([tx, ty])
        .iadd([0, TILE_SIZE_METERS / 2]);

      this.addLoader([tx, ty], (game: Game) => [
        game.addEntity(new Anemone(worldPos)),
      ]);
    }

    const totalSeaweed = Math.floor(available.length * 0.5);
    for (let i = 0; i < totalSeaweed; i++) {
      const tx = available.pop()!;
      const ty = this.worldMap.groundMap.getHighestTile(tx) - 1;
      const worldPos = this.worldMap
        .tileToWorld([tx, ty])
        .iadd([0, TILE_SIZE_METERS / 2]);

      this.addLoader([tx, ty], (game: Game) => [
        game.addEntity(new Seaweed(worldPos)),
      ]);
    }
  }

  addLoader(tilePos: TilePos, loader: LoadFunction) {
    const loaders = this.loaderMap.getOrCreate(tilePos, []);
    loaders.push(loader);
  }

  makeDeeperStuff() {
    const available: TilePos[] = [];
    for (let x = this.worldMap.minX; x < this.worldMap.maxX; x++) {
      for (let y = 5; y < this.worldMap.maxY; x++) {
        if (!this.worldMap.groundMap.tileIsSolid([x, y])) {
          available.push([x, y]);
        }
      }
    }

    shuffle(available);

    while (available.length > 0) {
      const tilePos = available.pop()!;
      const worldPos = this.worldMap.tileToWorld(tilePos);
      this.addLoader(tilePos, (game: Game) => [
        game.addEntity(new FishSpawner(worldPos)),
      ]);
    }
  }

  getEntities(game: Game, tilePos: TilePos): Entity[] {
    const result = [];
    for (const f of this.loaderMap.get(tilePos) ?? []) {
      const entities = f(game);
      result.push(...entities);
    }
    return result;
  }
}
