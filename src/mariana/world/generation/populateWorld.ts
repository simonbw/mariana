import Entity from "../../../core/entity/Entity";
import Game from "../../../core/Game";
import { range } from "../../../core/util/FunctionalUtils";
import { shuffle } from "../../../core/util/Random";
import { V2d } from "../../../core/Vector";
import { TILE_SIZE_METERS } from "../../constants";
import { Eel } from "../../fish/aggressive/Eel";
import Jellyfish from "../../fish/aggressive/Jellyfish";
import { FishSpawner } from "../../fish/FishSpawner";
import { UndertowLoader } from "../../misc-stuff/undertow/UndertowLoader";
import { Anemone } from "../../plants/Anemone";
import { Seaweed } from "../../plants/Seaweed";
import { Soulweed } from "../../plants/Soulweed";
import { makeNeighbors } from "../../utils/gridUtils";
import { TileLoadListener } from "../loading/OnLoader";
import { TilePos } from "../TilePos";
import { WorldMap } from "../WorldMap";
import { TileList } from "./TileList";

/** Generates the stuff in the world */
export function populateWorld(worldMap: WorldMap): Entity[] {
  console.time("populateWorld");
  const entities = [...populateSurface(worldMap), ...makeDeeperStuff(worldMap)];
  console.timeEnd("populateWorld");
  return entities;
}

/** Generates the stuff on the surface */
export function populateSurface(worldMap: WorldMap) {
  const entities: Entity[] = [];

  const available = new TileList(
    range(worldMap.minX, worldMap.maxX).map((x) => [
      x,
      worldMap.groundMap.getHighestTile(x) - 1,
    ])
  );

  const tileToWorld = (tilePos: TilePos): V2d => {
    return worldMap.tileToWorld(tilePos).iadd([0, TILE_SIZE_METERS / 2]);
  };

  const totalAnemonies = Math.floor(available.size * 0.1);

  for (const tilePos of available.take(totalAnemonies)) {
    const worldPos = tileToWorld(tilePos);
    entities.push(
      new TileLoadListener(tilePos, (game: Game) =>
        game.addEntity(new Anemone(worldPos))
      )
    );
  }

  const totalSeaweeds = Math.floor(available.size * 0.5);
  for (const tilePos of available.take(totalSeaweeds)) {
    const worldPos = tileToWorld(tilePos);
    entities.push(
      new TileLoadListener(tilePos, (game: Game) =>
        game.addEntity(new Seaweed(worldPos))
      )
    );
  }

  const soulPlants = Math.floor(available.size * 0.3);
  for (const tilePos of available.take(soulPlants)) {
    const worldPos = tileToWorld(tilePos);
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
  const tiles: TilePos[] = [];

  for (let x = worldMap.minX; x < worldMap.maxX; x++) {
    for (let y = 5; y < worldMap.maxY; y++) {
      if (!worldMap.groundMap.tileIsSolid([x, y])) {
        tiles.push([x, y]);
      }
    }
  }
  shuffle(tiles);

  const available = new TileList(tiles);

  const jellyfishNumber = Math.floor(available.size * 0.05);
  for (const tilePos of available.take(jellyfishNumber)) {
    const worldPos = worldMap.tileToWorld(tilePos);
    entities.push(
      new TileLoadListener(tilePos, (game: Game) => [
        game.addEntity(
          new FishSpawner(
            worldPos,
            (game) => {
              game.addEntity(new Jellyfish(worldPos));
            },
            (game) => game.entities.getTagged("jellyfish").length,
            5,
            1.0 / 10
          )
        ),
      ])
    );
  }

  const eelNumber = Math.floor(available.size * 0.002);
  for (const tilePos of available.take(eelNumber)) {
    const worldPos = worldMap.tileToWorld(tilePos);
    entities.push(
      new TileLoadListener(tilePos, (game: Game) => [
        game.addEntity(
          new FishSpawner(
            worldPos,
            (game) => {
              game.addEntity(new Eel(worldPos));
            },
            (game) => game.entities.getTagged("eel").length,
            2,
            1.0 / 30
          )
        ),
      ])
    );
  }

  // TODO: Grabbers

  // entities.push(...makeUndertows(worldMap, available));

  return entities;
}

// TODO: This is too slow
function makeUndertows(worldMap: WorldMap, available: TileList): Entity[] {
  const entities: Entity[] = [];
  function getUndertowTile() {
    return available.popFiltered((center) => {
      for (const neighbor of makeNeighbors(center, 1, 2)) {
        if (worldMap.groundMap.tileIsSolid(neighbor)) {
          return false;
        }
      }
      const shouldBeSolid: TilePos[] = [
        [center[0] - 2, center[1] - 1],
        [center[0] + 2, center[1] - 1],
        [center[0] - 2, center[1]],
        [center[0] + 2, center[1]],
        [center[0] - 2, center[1] + 1],
        [center[0] + 2, center[1] + 1],
      ];
      for (const t of shouldBeSolid) {
        if (!worldMap.groundMap.tileIsSolid(t)) {
          return false;
        }
      }
      return true;
    });
  }

  let undertowTile = getUndertowTile();
  let undertowsRemaining = 10;
  while (undertowTile) {
    undertowsRemaining -= 1;
    available.remove(...makeNeighbors(undertowTile, 2, 4));
    entities.push(new UndertowLoader(worldMap.tileToWorld(undertowTile)));
    console.log("undertow at ", undertowTile);
    undertowTile = getUndertowTile();
    if (undertowsRemaining <= 0) {
      break;
    }
  }

  return entities;
}
