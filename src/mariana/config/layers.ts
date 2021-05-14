import Game from "../../core/Game";
import { LayerInfo } from "../../core/graphics/LayerInfo";

/** Layers for rendering stuff in front of other stuff */
export enum Layer {
  /** The sky */
  SKY = "sky",
  /** The sun */
  SUN = "sun",
  /** The real background layer */
  BACKGROUND = "background",
  /** The clouds, for parallax */
  CLOUDS = "clouds",
  /** The clouds, for parallax, again */
  CLOUDS2 = "clouds2",
  /** Stuff that renders behind the normal stuff */
  WORLD_BACK = "world_back",
  /** The main layer where most stuff is */
  WORLD = "world",
  /** Stuff that renders in front of other stuff, but still in the water */
  WORLD_FRONT = "world_front",
  /** The blue part of water */
  WATER_OVERLAY = "water_overlay",
  /** Stuff that renders in front of the water too */
  WORLD_FRONTER = "world_fronter",
  /** Layer reserved for rendering lighting */
  LIGHTING = "lighting",
  /** Stuff that's still in the world, but is on top of the lighting */
  GLOW = "glow",
  /** Stuff not in the world, so it doesn't move when the camera moves */
  HUD = "hud",
  /** Stuff above even the HUD */
  MENU = "menu",
  /** debug info that goes on top of everything */
  DEBUG_INFO = "debug_info",
}

// Special layers that don't move with the camera
const PARALAX_FREE_LAYERS = [
  Layer.HUD,
  Layer.MENU,
  Layer.LIGHTING,
  Layer.DEBUG_INFO,
];

// Set up the game to use our layers
export function initLayers(game: Game) {
  for (const layerName of Object.values(Layer)) {
    game.renderer.createLayer(layerName, new LayerInfo({}));
  }

  for (const layerName of PARALAX_FREE_LAYERS) {
    game.renderer.layerInfos.get(layerName)!.paralax.set(0, 0);
  }

  game.renderer.layerInfos.get(Layer.SUN)!.paralax.set(0.1, 0.9);
  game.renderer.layerInfos.get(Layer.CLOUDS)!.paralax.set(0.5, 1.0);
  game.renderer.layerInfos.get(Layer.CLOUDS2)!.paralax.set(0.7, 1.0);

  // game.renderer.layerInfos.get(Layer.BACKGROUND)!.paralax = 0.9;

  game.renderer.defaultLayer = Layer.WORLD;
}
