import type { CellKey, ClueEntry, CrosswordCell } from "../types";
import { makeKey, parseKey, computeBounds } from "./gridHelpers";

export function assignClueNumbers(cells: Record<CellKey, CrosswordCell>): {
  cells: Record<CellKey, CrosswordCell>;
  across: ClueEntry[];
  down: ClueEntry[];
} {
  const bounds = computeBounds(cells);
  if (!bounds) return { cells, across: [], down: [] };

  const updated = { ...cells };
  const across: ClueEntry[] = [];
  const down: ClueEntry[] = [];
  let currentNumber = 1;

  // Clear all existing clue numbers
  for (const key of Object.keys(updated) as CellKey[]) {
    updated[key] = { ...updated[key]!, clueNumber: null };
  }

  // Traverse in row-then-column order
  for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
    for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
      const key = makeKey(row, col);
      const cell = updated[key];
      if (!cell || cell.isBlack) continue;

      const startsAcross = isAcrossStart(row, col, updated);
      const startsDown = isDownStart(row, col, updated);

      if (startsAcross || startsDown) {
        updated[key] = { ...updated[key]!, clueNumber: currentNumber };

        if (startsAcross) {
          across.push({ number: currentNumber, text: "", row, col });
        }
        if (startsDown) {
          down.push({ number: currentNumber, text: "", row, col });
        }

        currentNumber++;
      }
    }
  }

  return { cells: updated, across, down };
}

function isAcrossStart(
  row: number,
  col: number,
  cells: Record<CellKey, CrosswordCell>,
): boolean {
  // No white cell to the left
  const leftKey = makeKey(row, col - 1);
  const leftCell = cells[leftKey];
  if (leftCell && !leftCell.isBlack) return false;

  // Has white cell to the right
  const rightKey = makeKey(row, col + 1);
  const rightCell = cells[rightKey];
  return !!rightCell && !rightCell.isBlack;
}

function isDownStart(
  row: number,
  col: number,
  cells: Record<CellKey, CrosswordCell>,
): boolean {
  // No white cell above
  const upKey = makeKey(row - 1, col);
  const upCell = cells[upKey];
  if (upCell && !upCell.isBlack) return false;

  // Has white cell below
  const downKey = makeKey(row + 1, col);
  const downCell = cells[downKey];
  return !!downCell && !downCell.isBlack;
}
