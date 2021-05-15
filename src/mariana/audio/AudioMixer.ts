import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";

type ChannelName = "music" | "underwaterSound" | "surfaceSound";
export class AudioMixer extends BaseEntity implements Entity {
  id = "audioMixer";

  channels: Record<ChannelName, AudioNode>;

  constructor(ctx: AudioContext) {
    super();

    this.channels = {
      music: ctx.createGain(),
      surfaceSound: ctx.createGain(),
      underwaterSound: ctx.createGain(),
    };
  }

  onAdd(game: Game) {}
}

function mgetChannelNode(game: Game, channelName: ChannelName): AudioNode {
  return null as any;
}
