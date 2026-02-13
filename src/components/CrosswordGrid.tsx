import type { CellKey, CrosswordData, Direction } from "../types";
import {
  computeBounds,
  makeKey,
  getEdgeDirections,
  isRemovable,
} from "../utils/gridHelpers";
import { GridCell } from "./GridCell";
import { SIDEBAR_WIDTH, MAX_CELL_SIZE, MIN_CELL_SIZE } from "../constants";
import * as styles from "styles/crossword.css";

interface CrosswordGridProps {
  data: CrosswordData;
  secretCol: number | null;
  showRowNumbers: boolean;
  onRemoveCell: (key: CellKey) => void;
  onSetLetter: (key: CellKey, letter: string) => void;
  onAddCell: (row: number, col: number, direction: Direction) => void;
}

export function CrosswordGrid({
  data,
  secretCol,
  showRowNumbers,
  onRemoveCell,
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

  // Compute secret column edge rows (min/max non-black rows in the secret column)
  let secretMinRow: number | null = null;
  let secretMaxRow: number | null = null;
  if (secretCol !== null) {
    for (let row = minRow; row <= maxRow; row++) {
      const cell = data.cells[makeKey(row, secretCol)];
      if (cell && !cell.isBlack) {
        if (secretMinRow === null) secretMinRow = row;
        secretMaxRow = row;
      }
    }
  }

  const gridItems: React.ReactNode[] = [];

  for (let row = minRow; row <= maxRow; row++) {
    if (showRowNumbers) {
      gridItems.push(
        <div key={`rn-${row}`} className={styles.rowNumber} style={{ height: cellSize }}>
          {row - minRow + 1}
        </div>,
      );
    }
    for (let col = minCol; col <= maxCol; col++) {
      const key = makeKey(row, col);
      const cell = data.cells[key];

      if (cell) {
        const edgeDirs = getEdgeDirections(key, data.cells);
        const removable = isRemovable(key, data.cells);

        let secretEdges: {
          left: boolean;
          right: boolean;
          top: boolean;
          bottom: boolean;
        } | null = null;
        if (
          col === secretCol &&
          !cell.isBlack &&
          secretMinRow !== null &&
          secretMaxRow !== null
        ) {
          secretEdges = {
            left: true,
            right: true,
            top: row === secretMinRow,
            bottom: row === secretMaxRow,
          };
        }

        gridItems.push(
          <GridCell
            key={key}
            cell={cell}
            cellKey={key}
            cellSize={cellSize}
            edgeDirections={edgeDirs}
            isRemovable={removable}
            secretEdges={secretEdges}
            onRemoveCell={onRemoveCell}
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
          gridTemplateColumns: showRowNumbers
            ? `auto repeat(${numCols}, ${cellSize}px)`
            : `repeat(${numCols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
        }}
        role="grid"
      >
        {gridItems}
      </div>
    </div>
  );
}
