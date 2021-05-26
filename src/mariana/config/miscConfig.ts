import { settings as PixiTilemapSettings } from "@pixi/tilemap";

export function miscConfig() {
  PixiTilemapSettings.TEXTURES_PER_TILEMAP = 32;
  PixiTilemapSettings.use32bitIndex = true;
}
