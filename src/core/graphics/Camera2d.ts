import { Matrix, Point } from "pixi.js";
import BaseEntity from "../entity/BaseEntity";
import Entity from "../entity/Entity";
import { lerpOrSnap } from "../util/MathUtil";
import { V, V2d } from "../Vector";
import { GameRenderer2d } from "./GameRenderer2d";
import { LayerInfo } from "./LayerInfo";

//  Controls the viewport.
export class Camera2d extends BaseEntity implements Entity {
  tags = ["camera"];
  persistenceLevel = 100;

  renderer: GameRenderer2d;
  position: V2d;
  z: number;
  angle: number;
  velocity: V2d;

  paralaxScale = 0.1;

  constructor(
    renderer: GameRenderer2d,
    position: V2d = V([0, 0]),
    z = 25.0,
    angle = 0
  ) {
    super();
    this.renderer = renderer;
    this.position = position;
    this.z = z;
    this.angle = angle;
    this.velocity = V([0, 0]);
  }

  get x() {
    return this.position[0];
  }

  set x(value) {
    this.position[0] = value;
  }

  get y() {
    return this.position[1];
  }

  set y(value) {
    this.position[1] = value;
  }

  get vx() {
    return this.velocity[0];
  }

  set vx(value) {
    this.velocity[0] = value;
  }

  get vy() {
    return this.velocity[1];
  }

  set vy(value) {
    this.velocity[1] = value;
  }

  getPosition() {
    return this.position;
  }

  onTick(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Center the camera on a position */
  center([x, y]: [number, number]) {
    this.x = x;
    this.y = y;
  }

  /** Move the camera toward being centered on a position, with a target velocity */
  smoothCenter(
    [x, y]: [number, number],
    [vx, vy]: [number, number] = V([0, 0]),
    smooth: number = 0.9
  ) {
    const dx = (x - this.x) / this.game!.averageFrameDuration;
    const dy = (y - this.y) / this.game!.averageFrameDuration;
    this.smoothSetVelocity(V([vx + dx, vy + dy]), smooth);
  }

  smoothSetVelocity([vx, vy]: [number, number], smooth: number = 0.9) {
    this.vx = lerpOrSnap(this.vx, vx, smooth);
    this.vy = lerpOrSnap(this.vy, vy, smooth);
  }

  /** Move the camera part of the way to the desired zoom. */
  smoothZoom(z: number, smooth: number = 0.9) {
    this.z = smooth * this.z + (1 - smooth) * z;
  }

  /** Returns [width, height] of the viewport in pixels */
  private _viewportSize = V(0, 0);
  getViewportSize(): V2d {
    return this._viewportSize.set(
      this.renderer.pixiRenderer.width / this.renderer.pixiRenderer.resolution,
      this.renderer.pixiRenderer.height / this.renderer.pixiRenderer.resolution
    );
  }

  getWorldViewport() {
    const [left, top] = this.toWorld(V(0, 0));
    const [right, bottom] = this.toWorld(this.getViewportSize());
    return new Viewport({ top, bottom, left, right });
  }

  private _world = V(0, 0);
  private _temp = new Point();
  /** Convert screen coordinates to world coordinates */
  toWorld([x, y]: V2d, parallax: [number, number] = [1.0, 1.0]): V2d {
    const local = this._temp.set(x, y);
    const world = this.getMatrix(parallax).applyInverse(local, local);
    return this._world.set(world.x, world.y);
  }

  private _screen = V(0, 0);
  /** Convert world coordinates to screen coordinates */
  toScreen([x, y]: V2d, parallax: [number, number] = [1.0, 1.0]): V2d {
    const local = this._temp.set(x, y);
    const screen = this.getMatrix(parallax).apply(local, local);
    return this._screen.set(screen.x, screen.y);
  }

  private _matrix = new Matrix();
  /** Creates a transformation matrix to go from screen world space to screen space. */
  getMatrix(
    [px, py]: [number, number] = [1, 1],
    [ax, ay]: [number, number] = V(0, 0)
  ): Matrix {
    const [w, h] = this.getViewportSize();
    const { x: cx, y: cy, z, angle } = this;

    return (
      this._matrix
        .identity()
        // align the anchor with the camera
        .translate(ax * px, ay * py)
        .translate(-cx * px, -cy * py)
        // do all the scaling and rotating
        .scale(z * px, z * py)
        .rotate(angle)
        // put it back
        .translate(-ax * z, -ay * z)
        .scale(1 / px, 1 / py)
        // Put it on the center of the screen
        .translate(w / 2.0, h / 2.0)
    );
  }

  /** Update the properties of a renderer layer to match this camera */
  updateLayer(layer: LayerInfo) {
    const container = layer.container;
    if (!layer.paralax.equals([0, 0])) {
      container.transform.setFromMatrix(
        this.getMatrix(layer.paralax, layer.anchor)
      );
    }
  }
}

/** Represents the area that a camera can see */
class Viewport {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;

  constructor({
    top,
    bottom,
    left,
    right,
  }: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) {
    this.top = top;
    this.bottom = bottom;
    this.left = left;
    this.right = right;
    this.width = right - left;
    this.height = bottom - top;
  }

  /**  */
  containsPoint([x, y]: [number, number], buffer = 0.0): boolean {
    return (
      x > this.left - buffer &&
      x < this.right + buffer &&
      y < this.bottom + buffer &&
      y > this.top - buffer
    );
  }
}
