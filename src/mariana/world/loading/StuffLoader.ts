import BaseEntity from "../../../core/entity/BaseEntity";
import Entity from "../../../core/entity/Entity";
import Grid from "../../../core/util/Grid";
import { TilePos } from "../TilePos";
import { WorldMap } from "../WorldMap";

export class StuffLoader extends BaseEntity implements Entity {
  entitiesLoaded: Grid<Entity[]> = new Grid();

  constructor(public worldMap: WorldMap) {
    super();
  }

  loadTile(tilePos: TilePos): void {
    const toAdd = this.worldMap.stuffMap.getEntities(this.game!, tilePos);
    const entities = this.entitiesLoaded.getOrCreate(tilePos, []);
    entities.push(...toAdd);
  }

  unloadTile(tilePos: TilePos): void {
    const entities = this.entitiesLoaded.get(tilePos);
    if (entities) {
      for (const entity of entities) {
        entity.destroy();
      }
    }
    this.entitiesLoaded.delete(tilePos);
  }

  handlers = {
    tileLoaded: ({ tilePos }: { tilePos: TilePos }) => {
      this.loadTile(tilePos);
    },
    tileUnloaded: ({ tilePos }: { tilePos: TilePos }) => {
      this.unloadTile(tilePos);
    },
  };
}
