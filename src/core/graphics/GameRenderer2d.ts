import {
  Container,
  Filter,
  Renderer as PixiRenderer,
  SCALE_MODES,
  settings as PixiSettings,
  utils as PixiUtils,
} from "pixi.js";
import { GameSprite } from "../entity/Entity";
import { V, V2d } from "../Vector";
import { Camera2d } from "./Camera2d";
import { LayerInfo } from "./LayerInfo";

// The thing that renders stuff to the screen. Mostly for handling layers.
export class GameRenderer2d {
  layerInfos: Map<string, LayerInfo> = new Map();
  private cursor: CSSStyleDeclaration["cursor"] = "none";
  defaultLayer: string = "_default";
  spriteCount: number = 0;

  pixiRenderer: PixiRenderer;
  stage: Container;
  camera: Camera2d;

  constructor(private onResize?: ([width, height]: [number, number]) => void) {
    PixiSettings.RESOLUTION = window.devicePixelRatio || 1;
    PixiSettings.SPRITE_MAX_TEXTURES = 4;
    PixiUtils.skipHello();
    this.pixiRenderer = new PixiRenderer({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: false,
      autoDensity: true,
      resolution: PixiSettings.RESOLUTION,
    });
    document.body.appendChild(this.pixiRenderer.view);
    this.showCursor();

    this.stage = new Container();
    this.camera = new Camera2d(this);

    this.createLayer(this.defaultLayer, new LayerInfo());

    window.addEventListener("resize", () => this.handleResize());
  }

  private getLayerInfo(layerName: string) {
    const layerInfo = this.layerInfos.get(layerName);
    if (!layerInfo) {
      throw new Error(`Cannot find layer: ${layerName}`);
    }
    return layerInfo;
  }

  createLayer(name: string, layerInfo: LayerInfo) {
    this.layerInfos.set(name, layerInfo);
    this.stage.addChild(layerInfo.container);
  }

  getHeight(): number {
    return this.pixiRenderer.height / this.pixiRenderer.resolution;
  }

  getWidth(): number {
    return this.pixiRenderer.width / this.pixiRenderer.resolution;
  }

  getSize(): V2d {
    return V(this.getWidth(), this.getHeight());
  }

  setResolution(resolution: number) {
    PixiSettings.RESOLUTION = resolution;
    const view = this.pixiRenderer.view;
    this.pixiRenderer.destroy();
    this.pixiRenderer = new PixiRenderer({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: false,
      autoDensity: true,
      resolution: PixiSettings.RESOLUTION,
      view,
    });

    this.handleResize();
  }

  handleResize() {
    this.pixiRenderer.resize(window.innerWidth, window.innerHeight);
    this.onResize?.(this.getSize());
  }

  hideCursor() {
    this.cursor = "none";
  }

  showCursor() {
    this.cursor = "auto";
  }

  setCursor(value: CSSStyleDeclaration["cursor"]) {
    this.cursor = value;
  }

  // Render the current frame.
  render() {
    for (const layerInfo of this.layerInfos.values()) {
      this.camera.updateLayer(layerInfo);
    }
    this.pixiRenderer.render(this.stage);
    this.pixiRenderer.view.style.cursor = this.cursor;
  }

  addSprite(sprite: GameSprite): GameSprite {
    const layerName = sprite.layerName ?? this.defaultLayer;
    this.getLayerInfo(layerName).container.addChild(sprite);
    this.spriteCount += 1;
    return sprite;
  }

  // Remove a child from a specific layer.
  removeSprite(sprite: GameSprite): void {
    const layerName = sprite.layerName ?? this.defaultLayer;
    this.getLayerInfo(layerName).container.removeChild(sprite);
    this.spriteCount -= 1;
  }

  addLayerFilter(filter: Filter, layerName: string): void {
    const layer = this.getLayerInfo(layerName).container;
    layer.filters = [...layer.filters!, filter];
  }

  addStageFilter(filter: Filter): void {
    this.stage.filters ??= [];
    this.stage.filters.push(filter);
  }

  removeStageFilter(filterToRemove: Filter): void {
    this.stage.filters = (this.stage.filters ?? []).filter(
      (filter) => filter != filterToRemove
    );
  }
}
