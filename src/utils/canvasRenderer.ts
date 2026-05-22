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
  const cellSize = data.cellSize ?? CANVAS_CELL_SIZE;
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

  // Render each cell
  for (const key of Object.keys(data.cells) as CellKey[]) {
    const cell = data.cells[key]!;

    // In classic mode, black cells get a black fill; in secret mode they're skipped (transparent)
    if (cell.isBlack) {
      if (!isSecret) {
        const { row, col } = parseKey(key);
        const x = (col - minCol) * (cellSize + border);
        const y = (row - minRow) * (cellSize + border);
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
              fill: { color: COLORS.black, dropTarget: false },
            },
          ],
          viewBox: { top: 0, left: 0, width: outerSize, height: outerSize },
        });
      }
      continue;
    }

    const { row, col } = parseKey(key);
    const gridRow = row - minRow;
    const gridCol = col - minCol;

    // Round positions to avoid sub-pixel rendering
    const x = Math.round(gridCol * (cellSize + border));
    const y = Math.round(gridRow * (cellSize + border));

    // Draw cell with border using a single combined shape
    // Outer rect (border) with inner white rect creates clean borders
    const outerSize = Math.round(cellSize + border * 2);
    const innerSize = Math.round(cellSize);
    const borderOffset = border;

    elements.push({
      type: "shape",
      top: y - borderOffset,
      left: x - borderOffset,
      width: outerSize,
      height: outerSize,
      paths: [
        {
          // Outer black rectangle for border
          d: `M 0 0 H ${outerSize} V ${outerSize} H 0 Z M ${borderOffset} ${borderOffset} V ${outerSize - borderOffset} H ${outerSize - borderOffset} V ${borderOffset} H ${borderOffset} Z`,
          fill: { color: COLORS.border, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: outerSize, height: outerSize },
    });

    // White cell fill
    elements.push({
      type: "shape",
      top: y,
      left: x,
      width: innerSize,
      height: innerSize,
      paths: [
        {
          d: `M 0 0 H ${innerSize} V ${innerSize} H 0 Z`,
          fill: { color: COLORS.white, dropTarget: false },
        },
      ],
      viewBox: { top: 0, left: 0, width: innerSize, height: innerSize },
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

      // Round all positions for crisp rendering
      const frameX = Math.round(gridCol * (cellSize + border));
      const frameY = Math.round(gridRowMin * (cellSize + border));
      const frameW = Math.round(cellSize);
      const frameH = Math.round((gridRowMax - gridRowMin + 1) * (cellSize + border) - border);

      const bw = 6; // border thickness
      const outerW = frameW + bw * 2;
      const outerH = frameH + bw * 2;

      // Draw secret column frame using path with hole (more reliable rendering)
      elements.push({
        type: "shape",
        top: frameY - bw,
        left: frameX - bw,
        width: outerW,
        height: outerH,
        paths: [
          {
            // Outer rectangle with inner hole creates the frame
            d: `M 0 0 H ${outerW} V ${outerH} H 0 Z M ${bw} ${bw} V ${outerH - bw} H ${outerW - bw} V ${bw} H ${bw} Z`,
            fill: { color: COLORS.border, dropTarget: false },
          },
        ],
        viewBox: { top: 0, left: 0, width: outerW, height: outerH },
      });

      // Draw horizontal dividers inside the secret column frame
      const dividerThickness = 6;
      for (let row = secretMinRow + 1; row <= secretMaxRow; row++) {
        const gridRow = row - minRow;
        const dividerY = Math.round(gridRow * (cellSize + border) - dividerThickness / 2);
        elements.push({
          type: "shape",
          top: dividerY,
          left: frameX,
          width: frameW,
          height: dividerThickness,
          paths: [
            {
              d: `M 0 0 H ${frameW} V ${dividerThickness} H 0 Z`,
              fill: { color: COLORS.border, dropTarget: false },
            },
          ],
          viewBox: { top: 0, left: 0, width: frameW, height: dividerThickness },
        });
      }
    }
  }

  return elements;
}
