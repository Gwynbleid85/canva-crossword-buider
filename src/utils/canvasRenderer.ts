import type { CellKey, CrosswordData } from "../types";
import { computeBounds, parseKey } from "./gridHelpers";
import { CANVAS_CELL_SIZE, CANVAS_BORDER_WIDTH, COLORS } from "../constants";

type RenderedElement =
  | {
      type: "shape";
      top: number;
      left: number;
      width: number;
      height: number;
      paths: { d: string; fill: { color: string; dropTarget: boolean } }[];
      viewBox: { top: number; left: number; width: number; height: number };
    }
  | {
      type: "text";
      top: number;
      left: number;
      width: number;
      children: string[];
      fontSize: number;
      fontWeight: "bold" | "normal";
      color: string;
      textAlign: "center" | "start";
    };

export function renderToCanvasElements(data: CrosswordData): RenderedElement[] {
  const bounds = computeBounds(data.cells);
  if (!bounds) return [];

  const { minRow, maxRow, minCol, maxCol } = bounds;
  const numRows = maxRow - minRow + 1;
  const numCols = maxCol - minCol + 1;
  const cellSize = CANVAS_CELL_SIZE;
  const border = CANVAS_BORDER_WIDTH;

  const totalWidth = numCols * cellSize + (numCols + 1) * border;
  const totalHeight = numRows * cellSize + (numRows + 1) * border;

  const elements: RenderedElement[] = [];

  // Background rectangle (black) — acts as borders between cells
  elements.push({
    type: "shape",
    top: 0,
    left: 0,
    width: totalWidth,
    height: totalHeight,
    paths: [
      {
        d: `M 0 0 H ${totalWidth} V ${totalHeight} H 0 Z`,
        fill: { color: COLORS.black, dropTarget: false },
      },
    ],
    viewBox: { top: 0, left: 0, width: totalWidth, height: totalHeight },
  });

  // Render each cell
  for (const key of Object.keys(data.cells) as CellKey[]) {
    const cell = data.cells[key]!;
    const { row, col } = parseKey(key);
    const gridRow = row - minRow;
    const gridCol = col - minCol;

    const x = border + gridCol * (cellSize + border);
    const y = border + gridRow * (cellSize + border);

    // Cell fill rect (white or black)
    const fillColor = cell.isBlack ? COLORS.black : COLORS.white;
    elements.push({
      type: "shape",
      top: y,
      left: x,
      width: cellSize,
      height: cellSize,
      paths: [
        {
          d: `M 0 0 H ${cellSize} V ${cellSize} H 0 Z`,
          fill: { color: fillColor, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: cellSize, height: cellSize },
    });

    if (!cell.isBlack) {
      // Clue number (top-left, small)
      if (cell.clueNumber !== null) {
        elements.push({
          type: "text",
          top: y + 1,
          left: x + 2,
          width: cellSize / 2,
          children: [String(cell.clueNumber)],
          fontSize: 8,
          fontWeight: "normal",
          color: COLORS.black,
          textAlign: "start",
        });
      }

      // Letter (centered)
      if (cell.letter) {
        elements.push({
          type: "text",
          top: y + cellSize * 0.2,
          left: x,
          width: cellSize,
          children: [cell.letter],
          fontSize: 20,
          fontWeight: "bold",
          color: COLORS.black,
          textAlign: "center",
        });
      }
    }
  }

  return elements;
}
