import type { GapKey, Preset, PresetWidth, ProblemForm, SheetSettings, SizeKey } from "./types";

// A4 @ 96dpi。打印用 15mm 页边距（≈56.7px），这里取 56px 并在 TITLE_BLOCK 里留了余量，
// 保证「预览里放得下 = 打印一定放得下」。
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;
export const PAGE_PADDING = 56;

// 标题 + 姓名/日期/用时/得分栏 + 分隔线 + 下方间距的占位（与 styles.css 的 .sheet-title 对应，
// 实测约 90px，取 100 留 10px 余量）
const TITLE_BLOCK = 100;

// .problem-item 的 line-height，改 CSS 时必须同步这里
const LINE_HEIGHT = 1.15;

// 中 30px：标准行距下恰好 15 行 × 3 列 = 45 题/页（经典口算卷密度）
export const FONT_SIZES: Record<SizeKey, number> = { s: 24, m: 30, l: 36 };
export const GAP_FACTORS: Record<GapKey, number> = { compact: 0.5, normal: 0.8, loose: 1.2 };

export type SheetLayout = {
  fontSize: number;
  rowGap: number;
  rows: number;
  columns: number;
  perPage: number;
};

/**
 * 横向防溢出的列数上限表：按题面宽度档 × 出题形式 × 字号。
 * 数值来自浏览器 Times/SimSun 实测（题号 + 最小答题横线都算在内），
 * 列宽预算 4列=155px / 3列=214px / 2列=331px，均留 ≥10px 余量；
 * 比大小/求未知数题面更宽，归入 wide 档。预览里另有实测兜底告警。
 */
const COLUMN_CAPS: Record<PresetWidth, Record<"std" | "wide", Record<SizeKey, number>>> = {
  short: { std: { s: 4, m: 4, l: 3 }, wide: { s: 4, m: 3, l: 3 } },
  medium: { std: { s: 4, m: 3, l: 3 }, wide: { s: 3, m: 3, l: 2 } },
  long: { std: { s: 3, m: 3, l: 2 }, wide: { s: 3, m: 2, l: 2 } },
  xlong: { std: { s: 3, m: 2, l: 2 }, wide: { s: 3, m: 2, l: 2 } },
};

export const maxColumnsFor = (selected: Preset[], size: SizeKey, form: ProblemForm): number => {
  const variant = form === "standard" ? "std" : "wide";
  return selected.reduce((cap, preset) => Math.min(cap, COLUMN_CAPS[preset.width][variant][size]), 4);
};

/**
 * 纵向自动排版：由字号/行距算出一页能放几行，每页题数 = 行数 × 列数，永不溢出。
 * 行数确定后把剩余空隙均摊进行距（上限 +12px），版心贴到可用区底部，减少页底留白。
 */
export const layoutFor = (settings: SheetSettings, selected: Preset[], form: ProblemForm): SheetLayout => {
  const fontSize = FONT_SIZES[settings.fontSize];
  const nominalGap = Math.round(fontSize * GAP_FACTORS[settings.rowGap]);
  const rowHeight = Math.ceil(fontSize * LINE_HEIGHT);
  const available = PAGE_HEIGHT - PAGE_PADDING * 2 - TITLE_BLOCK;
  const rows = Math.max(1, Math.floor((available + nominalGap) / (rowHeight + nominalGap)));
  const rowGap =
    rows > 1
      ? Math.floor(Math.min(nominalGap + 12, (available - rows * rowHeight) / (rows - 1)) * 100) / 100
      : 0;
  const columns = Math.min(settings.columns, maxColumnsFor(selected, settings.fontSize, form));
  return { fontSize, rowGap, rows, columns, perPage: rows * columns };
};

// 答案页固定紧凑排版：小字多列，一页答案能覆盖多页题目
export const ANSWER_FONT_SIZE = 16;
export const ANSWER_ROW_GAP = 12;
const ANSWER_LINE_HEIGHT = 1.3;

export const answersPerPage = (numbered: boolean): number => {
  const rowHeight = Math.ceil(ANSWER_FONT_SIZE * ANSWER_LINE_HEIGHT);
  const available = PAGE_HEIGHT - PAGE_PADDING * 2 - TITLE_BLOCK;
  const rows = Math.floor((available + ANSWER_ROW_GAP) / (rowHeight + ANSWER_ROW_GAP));
  return rows * answerColumns(numbered);
};

export const answerColumns = (numbered: boolean) => (numbered ? 5 : 3);

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
};
