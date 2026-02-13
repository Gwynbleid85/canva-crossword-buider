import type { CellKey, CrosswordData, Direction } from "../types";
import {
  computeBounds,
  makeKey,
  getEdgeDirections,
} from "../utils/gridHelpers";
import { GridCell } from "./GridCell";
import { SIDEBAR_WIDTH, MAX_CELL_SIZE, MIN_CELL_SIZE } from "../constants";
import * as styles from "styles/crossword.css";

interface CrosswordGridProps {
  data: CrosswordData;
  onToggleBlack: (key: CellKey) => void;
  onSetLetter: (key: CellKey, letter: string) => void;
  onAddCell: (row: number, col: number, direction: Direction) => void;
}

export function CrosswordGrid({
  data,
  onToggleBlack,
  onSetLetter,
  onAddCell,
}: CrosswordGridProps) {
  const bounds = computeBounds(data.cells);
  if (!bounds) return null;

  const { minRow, maxRow, minCol, maxCol } = bounds;
  const numRows = maxRow - minRow + 1;
  const numCols = maxCol - minCol + 1;

  // Calculate cell size to fit sidebar width (with padding for add buttons)
  const availableWidth = SIDEBAR_WIDTH - 32; // padding for add buttons on edges
  const cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.min(MAX_CELL_SIZE, Math.floor(availableWidth / numCols)),
  );

  const gridItems: React.ReactNode[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const key = makeKey(row, col);
      const cell = data.cells[key];

      if (cell) {
        const edgeDirs = getEdgeDirections(key, data.cells);
        gridItems.push(
          <GridCell
            key={key}
            cell={cell}
            cellKey={key}
            cellSize={cellSize}
            edgeDirections={edgeDirs}
            onToggleBlack={onToggleBlack}
            onSetLetter={onSetLetter}
            onAddCell={onAddCell}
          />,
        );
      } else {
        // Empty placeholder position
        gridItems.push(
          <div
            key={key}
            className={styles.placeholder}
            style={{ width: cellSize, height: cellSize }}
          />,
        );
      }
    }
  }

  return (
    <div className={styles.gridWrapper}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
        }}
        role="grid"
      >
        {gridItems}
      </div>
    </div>
  );
}
