import type { CellKey, CrosswordData } from "../types";
import { computeBounds, parseKey, getFirstWhiteColPerRow } from "./gridHelpers";
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

const ROW_NUM_WIDTH = CANVAS_CELL_SIZE;

export function renderToCanvasElements(data: CrosswordData): RenderedElement[] {
  const bounds = computeBounds(data.cells);
  if (!bounds) return [];

  const { minRow, maxRow, maxCol } = bounds;
  let { minCol } = bounds;
  const cellSize = CANVAS_CELL_SIZE;
  const border = CANVAS_BORDER_WIDTH;

  const elements: RenderedElement[] = [];
  const isSecret = data.mode === "secret";

  // Extend grid left if any row needs a row number at minCol (secret mode only)
  let firstWhiteColPerRow: Map<number, number> | null = null;
  if (isSecret && data.showRowNumbers) {
    firstWhiteColPerRow = getFirstWhiteColPerRow(data.cells);
    for (const firstCol of firstWhiteColPerRow.values()) {
      if (firstCol === minCol) {
        minCol = minCol - 1;
        break;
      }
    }
  }

  // Render row numbers — positioned directly to the left of each row's first white cell (secret mode only)
  if (firstWhiteColPerRow) {
    for (const [row, firstWhiteCol] of firstWhiteColPerRow) {
      const gridRow = row - minRow;
      const y = gridRow * (cellSize + border);
      const x = (firstWhiteCol - minCol - 1) * (cellSize + border);
      elements.push({
        type: "text",
        top: y + cellSize * 0.2,
        left: x,
        width: ROW_NUM_WIDTH,
        children: [String(row - minRow + 1) + "."],
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        textAlign: "center",
      });
    }
  }

  const numRows = maxRow - minRow + 1;
  const numCols = maxCol - minCol + 1;

  // Classic mode: render a single black background rect covering the entire grid
  if (!isSecret) {
    const bgW = numCols * (cellSize + border) + border;
    const bgH = numRows * (cellSize + border) + border;
    elements.push({
      type: "shape",
      top: -border,
      left: -border,
      width: bgW,
      height: bgH,
      paths: [
        {
          d: `M 0 0 H ${bgW} V ${bgH} H 0 Z`,
          fill: { color: COLORS.black, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: bgW, height: bgH },
    });
  }

  // Render each cell
  for (const key of Object.keys(data.cells) as CellKey[]) {
    const cell = data.cells[key]!;
    if (cell.isBlack) continue; // Skip black cells (transparent)

    const { row, col } = parseKey(key);
    const gridRow = row - minRow;
    const gridCol = col - minCol;

    const x = gridCol * (cellSize + border);
    const y = gridRow * (cellSize + border);

    // Secret mode: per-cell black border rect behind the white cell
    if (isSecret) {
      const outerSize = cellSize + border * 2;
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
    }

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

    // Clue number in top-left (classic mode only)
    if (!isSecret && cell.clueNumber !== null) {
      elements.push({
        type: "text",
        top: y,
        left: x + 2,
        width: cellSize - 2,
        children: [String(cell.clueNumber)],
        fontSize: 10,
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

  // Render a single thick frame around the secret column (secret mode only)
  if (isSecret && data.secretCol !== null && data.secretCol !== undefined) {
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

      const frameX = gridCol * (cellSize + border);
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

      // Draw thin horizontal dividers inside the secret column frame
      for (let row = secretMinRow + 1; row <= secretMaxRow; row++) {
        const gridRow = row - minRow;
        const dividerY = gridRow * (cellSize + border) - border;
        elements.push({
          type: "shape",
          top: dividerY,
          left: frameX,
          width: cellSize,
          height: border,
          paths: [
            {
              d: `M 0 0 H ${cellSize} V ${border} H 0 Z`,
              fill: { color: COLORS.border, dropTarget: false },
            },
          ],
          viewBox: { top: 0, left: 0, width: cellSize, height: border },
        });
      }
    }
  }

  return elements;
}
