import type { CellKey, CrosswordData, CrosswordMode, Direction } from "../types";
import {
  computeBounds,
  makeKey,
  getEdgeDirections,
  isRemovable,
  getFirstWhiteColPerRow,
} from "../utils/gridHelpers";
import { GridCell } from "./GridCell";
import { SIDEBAR_WIDTH, MAX_CELL_SIZE, MIN_CELL_SIZE } from "../constants";
import * as styles from "styles/crossword.css";

interface CrosswordGridProps {
  data: CrosswordData;
  secretCol: number | null;
  showRowNumbers: boolean;
  mode: CrosswordMode;
  onRemoveCell: (key: CellKey) => void;
  onSetLetter: (key: CellKey, letter: string) => void;
  onAddCell: (row: number, col: number, direction: Direction) => void;
}

export function CrosswordGrid({
  data,
  secretCol,
  showRowNumbers,
  mode,
  onRemoveCell,
  onSetLetter,
  onAddCell,
}: CrosswordGridProps) {
  const bounds = computeBounds(data.cells);
  if (!bounds) return null;

  const { minRow, maxRow, maxCol } = bounds;
  let { minCol } = bounds;

  const isSecret = mode === "secret";

  const firstWhiteColPerRow = isSecret && showRowNumbers
    ? getFirstWhiteColPerRow(data.cells)
    : null;

  // Extend grid left by 1 column if any row's first white cell is at minCol
  if (firstWhiteColPerRow) {
    for (const firstCol of firstWhiteColPerRow.values()) {
      if (firstCol === minCol) {
        minCol = minCol - 1;
        break;
      }
    }
  }

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
  if (isSecret && secretCol !== null) {
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
          isSecret &&
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
            showClueNumber={!isSecret}
            onRemoveCell={onRemoveCell}
            onSetLetter={onSetLetter}
            onAddCell={onAddCell}
          />,
        );
      } else {
        // Check if this placeholder should show a row number
        const firstWhiteCol = firstWhiteColPerRow?.get(row);
        if (
          firstWhiteCol !== undefined &&
          firstWhiteCol > minCol &&
          col === firstWhiteCol - 1
        ) {
          gridItems.push(
            <div
              key={key}
              className={styles.rowNumber}
              style={{ width: cellSize, height: cellSize }}
            >
              {row - minRow + 1}.
            </div>,
          );
        } else {
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
