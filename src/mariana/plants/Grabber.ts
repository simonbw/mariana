import { Graphics } from "@pixi/graphics";
import { Body, LinearSpring, RotationalSpring } from "p2";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity, { GameSprite } from "../../core/entity/Entity";
import { V2d } from "../../core/Vector";

export class Grabber extends BaseEntity implements Entity {
  sprite: Graphics & GameSprite;

  constructor(position: V2d) {
    super();

    this.sprite = new Graphics();

    this.bodies = [];
    this.springs = [];

    for (let i = 0; i < 10; i++) {
      const body = new Body({
        position: position.add([0, 1]),
        mass: 0.1,
      });
      this.bodies.push(body);
    }
    this.bodies[0].mass = 0;
    this.bodies[0].type = Body.STATIC;

    for (let i = 1; i < this.bodies.length; i++) {
      const bodyA = this.bodies[i - 1];
      const bodyB = this.bodies[i];

      const linearSpring = new LinearSpring(bodyA, bodyB);
      const rotationalSpring = new RotationalSpring(bodyA, bodyB);
      // this.springs.push(linearSpring, rotationalSpring);
    }
  }

  onRender() {
    this.sprite.clear();

    const bodies = this.bodies!;
    this.sprite.moveTo(...bodies[0].position);
    for (let i = 1; i < bodies.length; i++) {
      const body = bodies[i];
      this.sprite.lineStyle({ width: 0.1 + 0.1 * i, color: 0x00ff00 });
      this.sprite.lineTo(...body.position);
    }

    for (const body of bodies) {
      this.sprite.lineStyle();
      this.sprite.beginFill(0x00ff00);
      const [x, y] = body.position;
      this.sprite.drawCircle(x, y, 1);
      this.sprite.endFill();
    }
  }
}
