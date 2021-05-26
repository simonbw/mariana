import img_referenceTileset2 from "../../../resources/images/tiles/reference-tileset-2.png";
import img_referenceTileset3 from "../../../resources/images/tiles/reference-tileset-3.png";
import img_referenceTileset4 from "../../../resources/images/tiles/reference-tileset-4.png";
import img_referenceTileset from "../../../resources/images/tiles/reference-tileset.png";
import { Tileset } from "../utils/Tileset";

let stoneTileset1: Tileset;
export function getStoneTileset1(): Tileset {
  return stoneTileset1 ?? (stoneTileset1 = new Tileset(img_referenceTileset));
}

let stoneTileset2: Tileset;
export function getStoneTileset2(): Tileset {
  return stoneTileset2 ?? (stoneTileset2 = new Tileset(img_referenceTileset2));
}

let stoneTileset3: Tileset;
export function getStoneTileset3(): Tileset {
  return stoneTileset3 ?? (stoneTileset3 = new Tileset(img_referenceTileset3));
}

let sandTileset1: Tileset;
export function getSandTileset1(): Tileset {
  return sandTileset1 ?? (sandTileset1 = new Tileset(img_referenceTileset4));
}
