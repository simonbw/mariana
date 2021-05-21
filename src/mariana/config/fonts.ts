import fnt_montserratLight from "../../../resources/fonts/Montserrat/Montserrat-Light.ttf";
import fnt_montserratBlack from "../../../resources/fonts/Montserrat/Montserrat-Black.ttf";
import fnt_montserratAlternatesBlack from "../../../resources/fonts/Montserrat_Alternates/MontserratAlternates-Black.ttf";

export function getFontsToPreload() {
  return [
    new FontFace("Montserrat Black", `url(${fnt_montserratBlack})`),
    new FontFace("Montserrat Light", `url(${fnt_montserratLight})`),
    new FontFace(
      "Montserrat Alternates Black",
      `url(${fnt_montserratAlternatesBlack})`
    ),
  ];
}

export const FONT_HEADING = "Montserrat Black";
export const FONT_BODY = "Montserrat Light";
export const FONT_ALTERNATE = "Montserrat Alternates Black";
