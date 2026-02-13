import { useCallback, useRef } from "react";
import type { CellKey, CrosswordCell, Direction } from "../types";
import { AddCellButton } from "./AddCellButton";
import * as styles from "styles/crossword.css";

interface GridCellProps {
  cell: CrosswordCell;
  cellKey: CellKey;
  cellSize: number;
  edgeDirections: Direction[];
  onToggleBlack: (key: CellKey) => void;
  onSetLetter: (key: CellKey, letter: string) => void;
  onAddCell: (row: number, col: number, direction: Direction) => void;
}

export function GridCell({
  cell,
  cellKey,
  cellSize,
  edgeDirections,
  onToggleBlack,
  onSetLetter,
  onAddCell,
}: GridCellProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    onToggleBlack(cellKey);
    ref.current?.focus();
  }, [cellKey, onToggleBlack]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        onSetLetter(cellKey, e.key);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onSetLetter(cellKey, "");
      }
    },
    [cellKey, onSetLetter],
  );

  const cellClass = cell.isBlack ? styles.cellBlack : styles.cellWhite;

  return (
    <div
      ref={ref}
      className={`${styles.cell} ${cellClass}`}
      style={{ width: cellSize, height: cellSize }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="gridcell"
      aria-label={`Cell ${cell.row},${cell.col}${cell.isBlack ? " (black)" : cell.letter ? ` letter ${cell.letter}` : ""}`}
    >
      {!cell.isBlack && cell.clueNumber !== null && (
        <span
          className={styles.clueNumber}
          style={{ fontSize: Math.max(7, cellSize * 0.22) }}
        >
          {cell.clueNumber}
        </span>
      )}
      {!cell.isBlack && cell.letter && (
        <span
          className={styles.letter}
          style={{ fontSize: Math.max(10, cellSize * 0.45) }}
        >
          {cell.letter}
        </span>
      )}
      {edgeDirections.map((dir) => (
        <AddCellButton
          key={dir}
          direction={dir}
          onClick={() => onAddCell(cell.row, cell.col, dir)}
        />
      ))}
    </div>
  );
}
