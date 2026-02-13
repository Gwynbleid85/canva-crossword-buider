import { useCallback, useState } from "react";
import type {
  CellKey,
  CrosswordCell,
  CrosswordData,
  CrosswordMode,
  Direction,
} from "../types";
import { makeKey, getNeighborPosition } from "../utils/gridHelpers";
import { assignClueNumbers } from "../utils/clueNumbering";
import { MAX_GRID_SIZE } from "../constants";
import { computeBounds } from "../utils/gridHelpers";

function createCell(row: number, col: number): CrosswordCell {
  return { row, col, isBlack: false, letter: "", clueNumber: null };
}

function withSecretCol(
  data: CrosswordData,
  secretCol: number | null,
): CrosswordData {
  return { ...data, secretCol };
}

function renumber(data: CrosswordData): CrosswordData {
  const result = assignClueNumbers(data.cells);

  // Preserve existing clue text
  const acrossTextMap = new Map(
    data.clues.across.map((c) => [c.number, c.text]),
  );
  const downTextMap = new Map(data.clues.down.map((c) => [c.number, c.text]));

  const across = result.across.map((c) => ({
    ...c,
    text: acrossTextMap.get(c.number) ?? "",
  }));
  const down = result.down.map((c) => ({
    ...c,
    text: downTextMap.get(c.number) ?? "",
  }));

  return {
    cells: result.cells,
    clues: { across, down },
    secretCol: data.secretCol,
    showRowNumbers: data.showRowNumbers,
    mode: data.mode,
  };
}

function createInitialState(): CrosswordData {
  const cells: Record<CellKey, CrosswordCell> = {
    [makeKey(0, 0)]: createCell(0, 0),
  };
  return renumber({
    cells,
    clues: { across: [], down: [] },
    secretCol: null,
    showRowNumbers: false,
    mode: "secret",
  });
}

export function useCrosswordState(initialData?: CrosswordData) {
  const [data, setData] = useState<CrosswordData>(
    initialData ?? createInitialState,
  );

  const addCell = useCallback((row: number, col: number) => {
    setData((prev) => {
      const key = makeKey(row, col);
      if (prev.cells[key]) return prev;

      // Check grid size limit
      const bounds = computeBounds(prev.cells);
      if (bounds) {
        const newMinRow = Math.min(bounds.minRow, row);
        const newMaxRow = Math.max(bounds.maxRow, row);
        const newMinCol = Math.min(bounds.minCol, col);
        const newMaxCol = Math.max(bounds.maxCol, col);
        if (
          newMaxRow - newMinRow + 1 > MAX_GRID_SIZE ||
          newMaxCol - newMinCol + 1 > MAX_GRID_SIZE
        ) {
          return prev;
        }
      }

      const newCells = { ...prev.cells, [key]: createCell(row, col) };
      return renumber({ ...prev, cells: newCells });
    });
  }, []);

  const removeCell = useCallback((key: CellKey) => {
    setData((prev) => {
      if (!prev.cells[key]) return prev;
      const newCells = { ...prev.cells };
      delete newCells[key];
      if (Object.keys(newCells).length === 0) return prev;
      return renumber({ ...prev, cells: newCells });
    });
  }, []);

  const toggleBlack = useCallback((key: CellKey) => {
    setData((prev) => {
      const cell = prev.cells[key];
      if (!cell) return prev;
      const newCells = {
        ...prev.cells,
        [key]: {
          ...cell,
          isBlack: !cell.isBlack,
          letter: "",
          clueNumber: null,
        },
      };
      return renumber({ ...prev, cells: newCells });
    });
  }, []);

  const setLetter = useCallback((key: CellKey, letter: string) => {
    setData((prev) => {
      const cell = prev.cells[key];
      if (!cell || cell.isBlack) return prev;
      const newCells = {
        ...prev.cells,
        [key]: { ...cell, letter: letter.toUpperCase().slice(0, 1) },
      };
      return { ...prev, cells: newCells };
    });
  }, []);

  const updateClueText = useCallback(
    (direction: "across" | "down", number: number, text: string) => {
      setData((prev) => {
        const clueList = prev.clues[direction].map((c) =>
          c.number === number ? { ...c, text } : c,
        );
        return {
          ...prev,
          clues: { ...prev.clues, [direction]: clueList },
        };
      });
    },
    [],
  );

  const addCellInDirection = useCallback(
    (row: number, col: number, direction: Direction) => {
      const pos = getNeighborPosition(row, col, direction);
      addCell(pos.row, pos.col);
    },
    [addCell],
  );

  const setSecretCol = useCallback((col: number | null) => {
    setData((prev) => withSecretCol(prev, col));
  }, []);

  const setShowRowNumbers = useCallback((showRowNumbers: boolean) => {
    setData((prev) => ({ ...prev, showRowNumbers }));
  }, []);

  const setMode = useCallback((mode: CrosswordMode) => {
    setData((prev) => ({ ...prev, mode }));
  }, []);

  const resetGrid = useCallback(() => {
    setData(createInitialState());
  }, []);

  const loadData = useCallback((newData: CrosswordData) => {
    setData(newData);
  }, []);

  return {
    data,
    addCell,
    removeCell,
    toggleBlack,
    setLetter,
    updateClueText,
    addCellInDirection,
    setSecretCol,
    setShowRowNumbers,
    setMode,
    resetGrid,
    loadData,
  };
}
