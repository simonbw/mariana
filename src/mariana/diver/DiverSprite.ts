import { Texture, SCALE_MODES, Sprite } from "pixi.js";
import img_diver from "../../../resources/images/diver/diver.png";
import img_diverLeft from "../../../resources/images/diver/diver_left.png";
import img_diverRight from "../../../resources/images/diver/diver_right.png";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { Diver, DIVER_HEIGHT } from "./Diver";

export class DiverSprite extends BaseEntity implements Entity {
  sprite: Sprite & GameSprite;

  textures = {
    forward: Texture.from(img_diver, { scaleMode: SCALE_MODES.NEAREST }),
    left: Texture.from(img_diverLeft, { scaleMode: SCALE_MODES.NEAREST }),
    right: Texture.from(img_diverRight, { scaleMode: SCALE_MODES.NEAREST }),
  };

  constructor(public diver: Diver) {
    super();

    this.sprite = new Sprite(this.textures.forward);
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(DIVER_HEIGHT / this.sprite.texture.height);
  }

  onRender() {
    this.sprite.position.set(...this.diver.body.position);

    const xMove = this.diver.moveDirection[0];
    if (xMove > 0.1) {
      this.sprite.texture = this.textures.right;
    } else if (xMove < -0.1) {
      this.sprite.texture = this.textures.left;
    } else {
      this.sprite.texture = this.textures.forward;
    }
  }
}
