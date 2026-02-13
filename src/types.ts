export type CellKey = `${number},${number}`;

export type CrosswordMode = "classic" | "secret";

export type Direction = "up" | "down" | "left" | "right";

export interface CrosswordCell {
  row: number;
  col: number;
  isBlack: boolean;
  letter: string;
  clueNumber: number | null;
}

export interface ClueEntry {
  number: number;
  text: string;
  row: number;
  col: number;
}

export interface CrosswordData {
  cells: Record<CellKey, CrosswordCell>;
  clues: { across: ClueEntry[]; down: ClueEntry[] };
  secretCol: number | null;
  showRowNumbers: boolean;
  mode: CrosswordMode;
}

export type AppElementData = {
  [key: string]:
    | number
    | boolean
    | string
    | null
    | { r: number; c: number; b: boolean; l: string; n: number | null }[]
    | { n: number; t: string; r: number; c: number }[];
  v: 1;
  cells: { r: number; c: number; b: boolean; l: string; n: number | null }[];
  ca: { n: number; t: string; r: number; c: number }[];
  cd: { n: number; t: string; r: number; c: number }[];
  sc: number | null;
  rn: boolean;
  m: string;
};
