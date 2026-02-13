import type { CellKey, CrosswordCell, Direction } from "../types";

export function makeKey(row: number, col: number): CellKey {
  return `${row},${col}`;
}

export function parseKey(key: CellKey): { row: number; col: number } {
  const [row, col] = key.split(",").map(Number);
  return { row: row!, col: col! };
}

export interface Bounds {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}

export function computeBounds(
  cells: Record<CellKey, CrosswordCell>,
): Bounds | null {
  const keys = Object.keys(cells) as CellKey[];
  if (keys.length === 0) return null;

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (const key of keys) {
    const { row, col } = parseKey(key);
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
  }

  return { minRow, maxRow, minCol, maxCol };
}

const DIRECTION_OFFSETS: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

export function getEdgeDirections(
  key: CellKey,
  cells: Record<CellKey, CrosswordCell>,
): Direction[] {
  const { row, col } = parseKey(key);
  const directions: Direction[] = [];

  for (const [dir, { dr, dc }] of Object.entries(DIRECTION_OFFSETS)) {
    const neighborKey = makeKey(row + dr, col + dc);
    if (!cells[neighborKey]) {
      directions.push(dir as Direction);
    }
  }

  return directions;
}

export function isRemovable(
  key: CellKey,
  cells: Record<CellKey, CrosswordCell>,
): boolean {
  const { row, col } = parseKey(key);
  const hasLeft = !!cells[makeKey(row, col - 1)];
  const hasRight = !!cells[makeKey(row, col + 1)];
  const hasUp = !!cells[makeKey(row - 1, col)];
  const hasDown = !!cells[makeKey(row + 1, col)];

  // Removable if at start/end of row or start/end of column
  return !hasLeft || !hasRight || !hasUp || !hasDown;
}

export function getNeighborPosition(
  row: number,
  col: number,
  direction: Direction,
): { row: number; col: number } {
  const { dr, dc } = DIRECTION_OFFSETS[direction];
  return { row: row + dr, col: col + dc };
}
