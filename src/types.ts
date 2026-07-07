export type Operator = "+" | "-" | "×" | "÷";

export type Rng = () => number;

/**
 * 算式题。terms.length === ops.length + 1。
 * blank 指学生要填写的位置：terms.length 表示求结果（标准形式），
 * 0..terms.length-1 表示该运算数留空（求未知数，题面渲染为 □）。
 */
export type EqProblem = {
  kind: "eq";
  terms: number[];
  ops: Operator[];
  answer: number;
  blank: number;
};

/** 有余数除法：dividend ÷ divisor = quotient …… remainder */
export type RemProblem = {
  kind: "rem";
  dividend: number;
  divisor: number;
  quotient: number;
  remainder: number;
};

/** 比大小：left 表达式 ○ value，学生在 ○ 里填 > < = */
export type CmpProblem = {
  kind: "cmp";
  terms: number[];
  ops: Operator[];
  value: number;
  relation: ">" | "<" | "=";
};

export type Problem = EqProblem | RemProblem | CmpProblem;

export type ProblemForm = "standard" | "blank" | "compare" | "mixed";

export type PresetGroup = "一年级" | "二年级" | "三年级";

/** 题面宽度档位，决定该题型允许的最大列数（防止横向溢出）；xlong = 有余数除法这类超宽题面 */
export type PresetWidth = "short" | "medium" | "long" | "xlong";

export type Preset = {
  id: string;
  name: string;
  group: PresetGroup;
  description: string;
  width: PresetWidth;
  supportsBlank: boolean;
  supportsCompare: boolean;
  generate: (rng: Rng) => Problem;
};

export type SizeKey = "s" | "m" | "l";
export type GapKey = "compact" | "normal" | "loose";

export type SheetSettings = {
  presetIds: string[];
  form: ProblemForm;
  pages: number;
  columns: 2 | 3 | 4;
  fontSize: SizeKey;
  rowGap: GapKey;
  numbered: boolean;
  underline: boolean;
  answerKey: boolean;
  /** 空字符串 = 按所选题型自动命名 */
  title: string;
  seed: string;
};
