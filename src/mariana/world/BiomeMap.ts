export enum Biome {
  Surface,
  Layer1,
  Layer2,
  Layer3,
  Bottom,
}

const BIOMES = Object.keys(Biome);

export default class BiomeMap {
  constructor(public minX: number, public maxX: number, public maxY: number) {}

  getBiome([x, y]: [number, number]): Biome {
    if (y < 40) {
      return Biome.Surface;
    } else if (y < 80) {
      return Biome.Layer1;
    } else if (y < 120) {
      return Biome.Layer2;
    } else if (y < 160) {
      return Biome.Layer3;
    } else {
      return Biome.Bottom;
    }
  }
}
