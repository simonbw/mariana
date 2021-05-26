import Grid from "../../../core/util/Grid";
import { Tileset } from "../../utils/Tileset";
import { TilePos } from "../TilePos";
import {
  getSandTileset1,
  getStoneTileset1,
  getStoneTileset2,
  getStoneTileset3,
} from "../tilesets";

interface Biome {
  tileset: Tileset;
}

export default class BiomeMap {
  biomes: Grid<Biome> = new Grid();

  surface: Biome;
  layer1: Biome;
  layer2: Biome;
  layer3: Biome;
  bottom: Biome;

  constructor(public minX: number, public maxX: number, public maxY: number) {
    this.surface = {
      tileset: getSandTileset1(),
    };
    this.layer1 = {
      tileset: getStoneTileset1(),
    };
    this.layer2 = {
      tileset: getStoneTileset2(),
    };
    this.layer3 = {
      tileset: getStoneTileset3(),
    };
    this.bottom = {
      tileset: getStoneTileset3(),
    };
  }

  getBiome([x, y]: TilePos): Biome {
    if (y < 40) {
      return this.surface;
    } else if (y < 140) {
      return this.layer1;
    } else if (y < 240) {
      return this.layer2;
    } else if (y < 340) {
      return this.layer3;
    } else {
      return this.bottom;
    }
  }
}
