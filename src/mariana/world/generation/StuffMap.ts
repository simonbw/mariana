import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import Grid from "../../../core/util/Grid";
import { rInteger, shuffle } from "../../../core/util/Random";
import { TilePos } from "../../../core/util/TilePos";
import { TILE_SIZE_METERS } from "../../constants";
import { Anemone } from "../../plants/Anemone";
import { WorldMap } from "../WorldMap";

type LoadFunction = (game: Game) => Entity[];

export default class GroundMap {
  private loaderMap: Grid<LoadFunction[]> = new Grid();

  constructor(private worldMap: WorldMap) {
    this.makeSurfaceStuff();
    this.makeDeeperStuff();
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
      const loaders = this.loaderMap.getOrCreate([tx, ty], []);
      const worldPos = this.worldMap
        .tileToWorld([tx, ty])
        .iadd([0, TILE_SIZE_METERS / 2]);
      loaders.push((game: Game) => [game.addEntity(new Anemone(worldPos))]);
    }
  }

  makeDeeperStuff() {}

  getEntities(game: Game, tilePos: TilePos): Entity[] {
    const result = [];
    for (const f of this.loaderMap.get(tilePos) ?? []) {
      const entities = f(game);
      console.log(entities);
      result.push(...entities);
    }
    return result;
  }
}
