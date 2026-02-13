import { useCallback, useRef } from "react";
import type { CellKey, CrosswordCell, Direction } from "../types";
import { AddCellButton } from "./AddCellButton";
import * as styles from "styles/crossword.css";

interface SecretEdges {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

interface GridCellProps {
  cell: CrosswordCell;
  cellKey: CellKey;
  cellSize: number;
  edgeDirections: Direction[];
  isRemovable: boolean;
  secretEdges: SecretEdges | null;
  showClueNumber?: boolean;
  onRemoveCell: (key: CellKey) => void;
  onSetLetter: (key: CellKey, letter: string) => void;
  onAddCell: (row: number, col: number, direction: Direction) => void;
}

export function GridCell({
  cell,
  cellKey,
  cellSize,
  edgeDirections,
  isRemovable,
  secretEdges,
  showClueNumber = false,
  onRemoveCell,
  onSetLetter,
  onAddCell,
}: GridCellProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    ref.current?.focus();
  }, []);

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

  const secretClass = secretEdges
    ? [
        secretEdges.left ? styles.cellSecretLeft : "",
        secretEdges.right ? styles.cellSecretRight : "",
        secretEdges.top ? styles.cellSecretTop : "",
        secretEdges.bottom ? styles.cellSecretBottom : "",
            ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div
      ref={ref}
      className={`${styles.cell} ${cellClass} ${secretClass}`}
      style={{ width: cellSize, height: cellSize }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="gridcell"
      aria-label={`Cell ${cell.row},${cell.col}${cell.isBlack ? " (black)" : cell.letter ? ` letter ${cell.letter}` : ""}`}
    >
      {showClueNumber && !cell.isBlack && cell.clueNumber !== null && (
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
      {!cell.isBlack && isRemovable && (
        <div className={styles.removeButtonWrapper}>
          <button
            className={styles.removeButton}
            onClick={(e) => {
              e.stopPropagation();
              onRemoveCell(cellKey);
            }}
            aria-label="Remove cell"
          >
            ×
          </button>
        </div>
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
