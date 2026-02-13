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

const ROW_NUM_WIDTH = 20;

export function renderToCanvasElements(data: CrosswordData): RenderedElement[] {
  const bounds = computeBounds(data.cells);
  if (!bounds) return [];

  const { minRow, maxRow, minCol, maxCol } = bounds;
  const cellSize = CANVAS_CELL_SIZE;
  const border = CANVAS_BORDER_WIDTH;
  const xOffset = data.showRowNumbers ? ROW_NUM_WIDTH : 0;

  const elements: RenderedElement[] = [];

  // Render row numbers
  if (data.showRowNumbers) {
    for (let row = minRow; row <= maxRow; row++) {
      const gridRow = row - minRow;
      const y = gridRow * (cellSize + border);
      elements.push({
        type: "text",
        top: y + cellSize * 0.2,
        left: 0,
        width: ROW_NUM_WIDTH - 2,
        children: [String(row - minRow + 1)],
        fontSize: 10,
        fontWeight: "normal",
        color: "#6b7280",
        textAlign: "center",
      });
    }
  }

  // Render each cell — only white cells get rendered
  for (const key of Object.keys(data.cells) as CellKey[]) {
    const cell = data.cells[key]!;
    if (cell.isBlack) continue; // Skip black cells (transparent)

    const { row, col } = parseKey(key);
    const gridRow = row - minRow;
    const gridCol = col - minCol;

    const x = gridCol * (cellSize + border) + xOffset;
    const y = gridRow * (cellSize + border);

    const outerSize = cellSize + border * 2;

    // Black border rect behind the white cell
    elements.push({
      type: "shape",
      top: y - border,
      left: x - border,
      width: outerSize,
      height: outerSize,
      paths: [
        {
          d: `M 0 0 H ${outerSize} V ${outerSize} H 0 Z`,
          fill: { color: COLORS.border, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: outerSize, height: outerSize },
    });

    // Cell fill rect (always white)
    elements.push({
      type: "shape",
      top: y,
      left: x,
      width: cellSize,
      height: cellSize,
      paths: [
        {
          d: `M 0 0 H ${cellSize} V ${cellSize} H 0 Z`,
          fill: { color: COLORS.white, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: cellSize, height: cellSize },
    });

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

  // Render a single thick frame around the secret column (on top of everything)
  if (data.secretCol !== null && data.secretCol !== undefined) {
    let secretMinRow: number | null = null;
    let secretMaxRow: number | null = null;
    for (const k of Object.keys(data.cells) as CellKey[]) {
      const c = data.cells[k]!;
      if (c.isBlack) continue;
      const { row, col: cellCol } = parseKey(k);
      if (cellCol === data.secretCol) {
        if (secretMinRow === null || row < secretMinRow) secretMinRow = row;
        if (secretMaxRow === null || row > secretMaxRow) secretMaxRow = row;
      }
    }

    if (secretMinRow !== null && secretMaxRow !== null) {
      const gridCol = data.secretCol - minCol;
      const gridRowMin = secretMinRow - minRow;
      const gridRowMax = secretMaxRow - minRow;

      const frameX = gridCol * (cellSize + border) + xOffset;
      const frameY = gridRowMin * (cellSize + border);
      const frameW = cellSize;
      const frameH =
        (gridRowMax - gridRowMin + 1) * (cellSize + border) - border;

      const bw = 2; // border thickness in viewBox units
      const outerW = frameW + bw * 2;
      const outerH = frameH + bw * 2;

      elements.push({
        type: "shape",
        top: frameY - bw,
        left: frameX - bw,
        width: outerW,
        height: outerH,
        paths: [
          {
            d: `M 0 0 H ${outerW} V ${outerH} H 0 Z`,
            fill: { color: COLORS.border, dropTarget: false },
          },
          {
            d: `M ${bw} ${bw} H ${outerW - bw} V ${outerH - bw} H ${bw} Z`,
            fill: { color: COLORS.white, dropTarget: false },
          },
        ],
        viewBox: { top: 0, left: 0, width: outerW, height: outerH },
      });
    }
  }

  return elements;
}
