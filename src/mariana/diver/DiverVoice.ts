import snd_dialogHelmetPain1 from "../../../resources/audio/dialog/dialog_helmet_pain1.flac";
import snd_dialogHelmetPain2 from "../../../resources/audio/dialog/dialog_helmet_pain2.flac";
import snd_dialogHelmetPain3 from "../../../resources/audio/dialog/dialog_helmet_pain3.flac";
import snd_dialogHelmetPain4 from "../../../resources/audio/dialog/dialog_helmet_pain4.flac";
import snd_dialogHelmetPain5 from "../../../resources/audio/dialog/dialog_helmet_pain5.flac";
import snd_dialogHelmetPain6 from "../../../resources/audio/dialog/dialog_helmet_pain6.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { ShuffleRing } from "../utils/ShuffleRing";
import { Diver } from "./Diver";

const HURT_SOUNDS = new ShuffleRing([
  snd_dialogHelmetPain1,
  snd_dialogHelmetPain2,
  snd_dialogHelmetPain3,
  snd_dialogHelmetPain4,
  snd_dialogHelmetPain5,
  snd_dialogHelmetPain6,
]);

export class DiverVoice extends BaseEntity implements Entity {
  constructor(diver: Diver) {
    super();
  }

  handlers = {
    diverHurt: () => {
      this.game?.addEntity(
        new SoundInstance(HURT_SOUNDS.getNext(), { gain: 0.5 })
      );
    },
  };
}
