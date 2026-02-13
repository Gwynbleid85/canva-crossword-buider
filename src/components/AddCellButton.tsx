import type { Direction } from "../types";
import * as styles from "styles/crossword.css";

interface AddCellButtonProps {
  direction: Direction;
  onClick: () => void;
}

const directionClass: Record<Direction, string> = {
  up: styles.addTop ?? "",
  down: styles.addBottom ?? "",
  left: styles.addLeft ?? "",
  right: styles.addRight ?? "",
};

export function AddCellButton({ direction, onClick }: AddCellButtonProps) {
  return (
    <div
      className={`${styles.addButtonWrapper ?? ""} ${directionClass[direction]}`}
    >
      <button
        className={styles.addButton}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`Add cell ${direction}`}
        type="button"
      >
        +
      </button>
    </div>
  );
}
