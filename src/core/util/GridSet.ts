import Grid from "./Grid";

type Cell = readonly [number, number];
type CellString = `${number},${number}`;

// A 2 dimensional map.
export default class GridSet implements Iterable<Cell> {
  data = new Set<CellString>();

  add(cell: Cell): void {
    this.data.add(cellToString(cell));
  }

  delete(cell: Cell): void {
    this.data.delete(cellToString(cell));
  }

  has(cell: Cell): boolean {
    return this.data.has(cellToString(cell));
  }

  size(): number {
    return this.data.size;
  }

  [Symbol.iterator](): Iterator<Cell> {
    return this.values();
  }

  values(): Iterator<Cell> {
    const it = this.data.values();

    return {
      next: () => {
        const v = it.next();
        if (v.done) {
          return v;
        } else {
          const value = stringToCell(v.value);
          return { value };
        }
      },
    };
  }
}

const cache = new Grid<CellString>();

// TODO: Normalize -0?
function cellToString(pos: Cell): CellString {
  if (!cache.has(pos)) {
    const [x, y] = pos;
    cache.set(pos, `${x},${y}` as CellString);
  }
  return cache.get(pos)!;
}

const stringToCellCache: Record<string, Cell> = {};

function stringToCell(s: CellString): Cell {
  if (!(s in stringToCellCache)) {
    const [x, y] = s.split(",");
    stringToCellCache[s] = [parseInt(x), parseInt(y)];
  }
  return stringToCellCache[s];
}
