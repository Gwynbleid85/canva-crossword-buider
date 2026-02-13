import type {
  AppElementData,
  CellKey,
  CrosswordData,
  CrosswordCell,
  CrosswordMode,
} from "../types";
import { makeKey } from "./gridHelpers";

export function serialize(data: CrosswordData): AppElementData {
  const cellEntries = Object.values(data.cells);
  return {
    v: 1,
    cells: cellEntries.map((c) => ({
      r: c.row,
      c: c.col,
      b: c.isBlack,
      l: c.letter,
      n: c.clueNumber,
    })),
    ca: data.clues.across.map((c) => ({
      n: c.number,
      t: c.text,
      r: c.row,
      c: c.col,
    })),
    cd: data.clues.down.map((c) => ({
      n: c.number,
      t: c.text,
      r: c.row,
      c: c.col,
    })),
    sc: data.secretCol ?? null,
    rn: data.showRowNumbers,
    m: data.mode,
  };
}

export function deserialize(appData: AppElementData): CrosswordData {
  const cells: Record<CellKey, CrosswordCell> = {};
  for (const c of appData.cells) {
    const key = makeKey(c.r, c.c);
    cells[key] = {
      row: c.r,
      col: c.c,
      isBlack: c.b,
      letter: c.l,
      clueNumber: c.n,
    };
  }

  return {
    cells,
    clues: {
      across: appData.ca.map((c) => ({
        number: c.n,
        text: c.t,
        row: c.r,
        col: c.c,
      })),
      down: appData.cd.map((c) => ({
        number: c.n,
        text: c.t,
        row: c.r,
        col: c.c,
      })),
    },
    secretCol: (appData.sc as number | null) ?? null,
    showRowNumbers: (appData.rn as boolean) ?? false,
    mode: ((appData.m as string) || "secret") as CrosswordMode,
  };
}

export function estimateSize(data: AppElementData): number {
  return JSON.stringify(data).length;
}
