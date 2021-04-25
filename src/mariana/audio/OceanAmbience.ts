import { vec2 } from "p2";
import snd_oceanTexture from "../../../resources/audio/ocean_texture.wav";
import snd_splash from "../../../resources/audio/splash.flac";
import snd_spookySinking from "../../../resources/audio/spooky_sinking.flac";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { SoundInstance } from "../../core/sound/SoundInstance";
import { clamp, lerp, smoothStep } from "../../core/util/MathUtil";
import { Diver } from "../Diver";

const CUTOFF_HIGH = 250;
const CUTOFF_LOW = 100;
const CUTOFF_SURFACE = 22050;
const SPOOKY_START_DEPTH = 20;
const SPOOKY_RAMP_DISTANCE = 30;

// This is the manager for all the long-running sounds
export class OceanAmbience extends BaseEntity implements Entity {
  persistenceLevel = 1;
  waveSounds: SoundInstance;
  spookySinking: SoundInstance;

  wasAboveWater = true;
  filter!: BiquadFilterNode;

  constructor() {
    super();

    this.waveSounds = this.addChild(
      new SoundInstance(snd_oceanTexture, {
        pauseable: false,
        continuous: true,
        gain: 0,
        outnode: () => this.filter,
        // randomStart: true,
      })
    );
    this.spookySinking = this.addChild(
      new SoundInstance(snd_spookySinking, {
        pauseable: false,
        continuous: true,
        gain: 0.3,
      })
    );
    this.spookySinking.gain = 0;
  }

  onAdd() {
    this.filter = this.game!.audio.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(22050, this.game!.audio.currentTime);
    this.filter.Q.value = 0.4;

    this.filter.connect(this.game!.masterGain);
  }

  onTick() {
    const diver = this.game!.entities.getById("diver") as Diver;
    const depth = diver?.getDepth() ?? 0;

    const t = this.game!.audio.currentTime;
    const speed = 0.12;

    const isAboveWater = depth < 0.4;

    if (this.wasAboveWater != isAboveWater) {
      this.addChild(
        new SoundInstance(snd_splash, {
          gain: clamp(Math.abs(diver.body.velocity[1] / 10), 0, 0.8),
          outnode: () => this.filter,
        })
      );
    }

    if (isAboveWater) {
      // above water
      this.filter.frequency.setTargetAtTime(CUTOFF_SURFACE, t, speed * 20);
      this.waveSounds.gainNode.gain.setTargetAtTime(0.07, t, speed);
    } else {
      // below water
      const target = lerp(
        CUTOFF_HIGH,
        CUTOFF_LOW,
        smoothStep(clamp(depth / 80))
      );
      this.filter.frequency.setTargetAtTime(target, t, speed);
      this.waveSounds.gainNode.gain.setTargetAtTime(0.2, t, speed);
    }

    this.spookySinking.gain = lerp(
      0,
      0.5,
      clamp((depth - SPOOKY_START_DEPTH) / SPOOKY_RAMP_DISTANCE)
    );

    this.wasAboveWater = isAboveWater;
  }
}
