import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { shuffle } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { TILE_SIZE_METERS } from "../../constants";
import { FishSpawner } from "../../fish/FishSpawner";
import { Anemone } from "../../plants/Anemone";
import { Seaweed } from "../../plants/Seaweed";
import { Soulweed } from "../../plants/Soulweed";
import { TileLoadListener } from "../loading/OnLoader";
import { TilePos } from "../TilePos";
import { WorldMap } from "../WorldMap";

/** Generates the stuff in the world */
export function populateWorld(worldMap: WorldMap): Entity[] {
  return [...populateSurface(worldMap)];
}

/** Generates the stuff on the surface */
export function populateSurface(worldMap: WorldMap) {
  const entities: Entity[] = [];

  const available: number[] = [];
  for (let x = worldMap.minX; x < worldMap.maxX; x++) {
    available.push(x);
  }
  shuffle(available);

  const getSurfacePos = (): [TilePos, V2d] => {
    const tx = available.pop()!;
    const ty = worldMap.groundMap.getHighestTile(tx) - 1;
    const worldPos = worldMap
      .tileToWorld([tx, ty])
      .iadd([0, TILE_SIZE_METERS / 2]);

    return [[tx, ty], worldPos];
  };

  const totalAnemonies = Math.floor(available.length * 0.1);
  for (let i = 0; i < totalAnemonies; i++) {
    const [tilePos, worldPos] = getSurfacePos();
    entities.push(
      new TileLoadListener(tilePos, (game: Game) =>
        game.addEntity(new Anemone(worldPos))
      )
    );
  }

  const totalSeaweeds = Math.floor(available.length * 0.5);
  for (let i = 0; i < totalSeaweeds; i++) {
    const [tilePos, worldPos] = getSurfacePos();
    entities.push(
      new TileLoadListener(tilePos, (game: Game) =>
        game.addEntity(new Seaweed(worldPos))
      )
    );
  }

  const soulPlants = Math.floor(available.length * 0.3);
  for (let i = 0; i < soulPlants; i++) {
    const [tilePos, worldPos] = getSurfacePos();
    entities.push(
      new TileLoadListener(tilePos, (game: Game) =>
        game.addEntity(new Soulweed(worldPos))
      )
    );
  }

  return entities;
}

/** Generates the deeper stuff */
export function makeDeeperStuff(worldMap: WorldMap) {
  const entities: Entity[] = [];
  const available: TilePos[] = [];

  for (let x = worldMap.minX; x < worldMap.maxX; x++) {
    for (let y = 5; y < worldMap.maxY; x++) {
      if (!worldMap.groundMap.tileIsSolid([x, y])) {
        available.push([x, y]);
      }
    }
  }

  shuffle(available);

  while (available.length > 0) {
    const tilePos = available.pop()!;
    const worldPos = worldMap.tileToWorld(tilePos);
    entities.push(
      new TileLoadListener(tilePos, (game: Game) => [
        game.addEntity(new FishSpawner(worldPos)),
      ])
    );
  }

  return entities;
}
