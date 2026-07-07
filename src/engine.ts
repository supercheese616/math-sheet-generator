import type {
  CmpProblem,
  EqProblem,
  Operator,
  Preset,
  PresetGroup,
  Problem,
  ProblemForm,
  Rng,
} from "./types";

const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

const pick = <T,>(items: T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/** Fisher-Yates 原地洗牌（用种子 rng，保证可复现） */
export const shuffle = <T,>(items: T[], rng: Rng): T[] => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

/** 求值：先乘除、后加减（乘加乘减题型依赖这一点） */
export const evaluate = (terms: number[], ops: Operator[]): number => {
  const t = [...terms];
  const o = [...ops];
  for (let i = 0; i < o.length; ) {
    if (o[i] === "×" || o[i] === "÷") {
      t.splice(i, 2, o[i] === "×" ? t[i] * t[i + 1] : t[i] / t[i + 1]);
      o.splice(i, 1);
    } else {
      i += 1;
    }
  }
  return o.reduce((acc, op, i) => (op === "+" ? acc + t[i + 1] : acc - t[i + 1]), t[0]);
};

const eq = (terms: number[], ops: Operator[]): EqProblem => ({
  kind: "eq",
  terms,
  ops,
  answer: evaluate(terms, ops),
  blank: terms.length,
});

/** 连加连减：每一步的中间结果都保持在 [0, max]，且至少两个非零项 */
const chain = (rng: Rng, max: number): EqProblem => {
  for (;;) {
    const ops: Operator[] = [rng() < 0.5 ? "+" : "-", rng() < 0.5 ? "+" : "-"];
    const terms = [int(rng, 0, max)];
    let acc = terms[0];
    for (const op of ops) {
      const next = op === "+" ? int(rng, 0, max - acc) : int(rng, 0, acc);
      terms.push(next);
      acc = op === "+" ? acc + next : acc - next;
    }
    if (terms.filter((t) => t !== 0).length >= 2) return eq(terms, ops);
  }
};

const swap = (rng: Rng, a: number, b: number): [number, number] => (rng() < 0.5 ? [a, b] : [b, a]);

export const presetGroups: PresetGroup[] = ["一年级", "二年级", "三年级"];

export const presets: Preset[] = [
  // ── 一年级 ──────────────────────────────────────────────
  {
    id: "add-10",
    name: "10以内加法",
    group: "一年级",
    description: "两个加数与和都不超过 10。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      // +0 的题教材里只偶尔出现，控制在 ~10%
      if (rng() < 0.1) return eq(swap(rng, int(rng, 1, 10), 0), ["+"]);
      const a = int(rng, 1, 9);
      return eq([a, int(rng, 1, 10 - a)], ["+"]);
    },
  },
  {
    id: "sub-10",
    name: "10以内减法",
    group: "一年级",
    description: "被减数不超过 10，差不为负。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      // -0 和得 0 的题控制在 ~12%，其余保证减数与差都非零
      if (rng() < 0.12) {
        const a = int(rng, 1, 10);
        return eq([a, rng() < 0.5 ? 0 : a], ["-"]);
      }
      const a = int(rng, 2, 10);
      return eq([a, int(rng, 1, a - 1)], ["-"]);
    },
  },
  {
    id: "add-20-nocarry",
    name: "20以内不进位加法",
    group: "一年级",
    description: "十几加几，个位不进位（如 12 + 5）。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      // +0 控制在 ~8%；其余加数非零且不进位
      const zeroish = rng() < 0.08;
      const ones = int(rng, 0, zeroish ? 9 : 8);
      const [a, b] = swap(rng, 10 + ones, zeroish ? 0 : int(rng, 1, 9 - ones));
      return eq([a, b], ["+"]);
    },
  },
  {
    id: "add-20-carry",
    name: "20以内进位加法",
    group: "一年级",
    description: "凑十法练习：两个一位数相加超过 10（如 8 + 7）。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const b = int(rng, 2, 9);
      const [x, y] = swap(rng, int(rng, 11 - b, 9), b);
      return eq([x, y], ["+"]);
    },
  },
  {
    id: "sub-20-borrow",
    name: "20以内退位减法",
    group: "一年级",
    description: "破十法练习：十几减一位数需要退位（如 15 - 7）。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const b = int(rng, 2, 9);
      return eq([10 + int(rng, 0, b - 1), b], ["-"]);
    },
  },
  {
    id: "chain-20",
    name: "20以内连加连减",
    group: "一年级",
    description: "三个数连加连减，每一步结果都在 0 到 20 之间。",
    width: "long",
    supportsBlank: false,
    supportsCompare: true,
    generate: (rng) => chain(rng, 20),
  },

  // ── 二年级 ──────────────────────────────────────────────
  {
    id: "add-100-nocarry",
    name: "100以内不进位加法",
    group: "二年级",
    description: "两个两位数相加，个位不进位。",
    width: "medium",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const ta = int(rng, 1, 8);
      const oa = int(rng, 0, 9);
      const b = int(rng, 1, 9 - ta) * 10 + int(rng, 0, 9 - oa);
      return eq([ta * 10 + oa, b], ["+"]);
    },
  },
  {
    id: "add-100-carry",
    name: "100以内进位加法",
    group: "二年级",
    description: "两个两位数相加，个位相加进位。",
    width: "medium",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const oa = int(rng, 1, 9);
      const ta = int(rng, 1, 7);
      const b = int(rng, 1, 8 - ta) * 10 + int(rng, 10 - oa, 9);
      return eq([ta * 10 + oa, b], ["+"]);
    },
  },
  {
    id: "sub-100-noborrow",
    name: "100以内不退位减法",
    group: "二年级",
    description: "十位个位都不用退位，适合竖式前训练。",
    width: "medium",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      for (;;) {
        const ta = int(rng, 1, 9);
        const oa = int(rng, 0, 9);
        const b = int(rng, 0, ta) * 10 + int(rng, 0, oa);
        if (b > 0) return eq([ta * 10 + oa, b], ["-"]);
      }
    },
  },
  {
    id: "sub-100-borrow",
    name: "100以内退位减法",
    group: "二年级",
    description: "个位不够减需要退位（如 42 - 17）。",
    width: "medium",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const oa = int(rng, 0, 8);
      const ta = int(rng, 1, 9);
      const b = int(rng, 0, ta - 1) * 10 + int(rng, oa + 1, 9);
      return eq([ta * 10 + oa, b], ["-"]);
    },
  },
  {
    id: "mul-table",
    name: "表内乘法",
    group: "二年级",
    description: "九九乘法表：两个乘数都在 1 到 9 之间。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => eq([int(rng, 1, 9), int(rng, 1, 9)], ["×"]),
  },
  {
    id: "div-table",
    name: "表内除法",
    group: "二年级",
    description: "用乘法口诀求商，保证整除。",
    width: "short",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const divisor = int(rng, 2, 9);
      return eq([divisor * int(rng, 1, 9), divisor], ["÷"]);
    },
  },
  {
    id: "mul-add",
    name: "乘加乘减",
    group: "二年级",
    description: "先乘后加减的两步口算（如 6 × 7 + 5）。",
    width: "long",
    supportsBlank: false,
    supportsCompare: true,
    generate: (rng) => {
      const a = int(rng, 2, 9);
      const b = int(rng, 2, 9);
      if (rng() < 0.5) return eq([a, b, int(rng, 1, 9)], ["×", "+"]);
      return eq([a, b, int(rng, 1, Math.min(9, a * b))], ["×", "-"]);
    },
  },
  {
    id: "chain-100",
    name: "100以内两步加减",
    group: "二年级",
    description: "三个数连加连减，每一步结果都在 0 到 100 之间。",
    width: "long",
    supportsBlank: false,
    supportsCompare: true,
    generate: (rng) => chain(rng, 100),
  },

  // ── 三年级 ──────────────────────────────────────────────
  {
    id: "div-remainder",
    name: "有余数除法",
    group: "三年级",
    description: "商和除数都在表内，余数比除数小（如 17 ÷ 5 = 3 …… 2）。",
    width: "xlong",
    supportsBlank: false,
    supportsCompare: false,
    generate: (rng) => {
      const divisor = int(rng, 2, 9);
      const quotient = int(rng, 2, 9);
      const remainder = int(rng, 1, divisor - 1);
      return {
        kind: "rem",
        dividend: divisor * quotient + remainder,
        divisor,
        quotient,
        remainder,
      };
    },
  },
  {
    id: "mul-round",
    name: "整十整百数乘一位数",
    group: "三年级",
    description: "口算乘法：如 40 × 6、300 × 8。",
    // 积可达四位数，比大小形式题面很宽，按 long 限列
    width: "long",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      const round = int(rng, 2, 9) * (rng() < 0.5 ? 10 : 100);
      const [a, b] = swap(rng, round, int(rng, 2, 9));
      return eq([a, b], ["×"]);
    },
  },
  {
    id: "add-sub-round",
    name: "整十数加减",
    group: "三年级",
    description: "1000 以内整十数加减（如 340 + 280、760 - 90）。",
    width: "long",
    supportsBlank: true,
    supportsCompare: true,
    generate: (rng) => {
      if (rng() < 0.5) {
        const a = int(rng, 2, 98) * 10;
        return eq([a, int(rng, 1, (1000 - a) / 10) * 10], ["+"]);
      }
      const a = int(rng, 3, 99) * 10;
      return eq([a, int(rng, 1, a / 10 - 1) * 10], ["-"]);
    },
  },
];

export const presetById = (id: string) => presets.find((preset) => preset.id === id);

// ── 题面 / 答案渲染 ──────────────────────────────────────

const BLANK_MARK = "□";
const COMPARE_MARK = "○";
const REMAINDER_MARK = "……";

export const expressionOf = (terms: number[], ops: Operator[], blank?: number) =>
  terms
    .map((term, i) => (i === blank ? BLANK_MARK : String(term)))
    .reduce((acc, part, i) => (i === 0 ? part : `${acc} ${ops[i - 1]} ${part}`), "");

export const questionTextOf = (problem: Problem): string => {
  if (problem.kind === "rem")
    return `${problem.dividend} ÷ ${problem.divisor} = ${BLANK_MARK} ${REMAINDER_MARK} ${BLANK_MARK}`;
  if (problem.kind === "cmp")
    return `${expressionOf(problem.terms, problem.ops)} ${COMPARE_MARK} ${problem.value}`;
  return problem.blank === problem.terms.length
    ? `${expressionOf(problem.terms, problem.ops)} =`
    : `${expressionOf(problem.terms, problem.ops, problem.blank)} = ${problem.answer}`;
};

/** 题目是否以「求结果」形式呈现（决定要不要画答题横线） */
export const isStandardEq = (problem: Problem): boolean =>
  problem.kind === "eq" && problem.blank === problem.terms.length;

/** 紧凑答案：只给该题要填的东西 */
export const shortAnswerOf = (problem: Problem): string => {
  if (problem.kind === "rem") return `${problem.quotient} ${REMAINDER_MARK} ${problem.remainder}`;
  if (problem.kind === "cmp") return problem.relation;
  return String(problem.blank === problem.terms.length ? problem.answer : problem.terms[problem.blank]);
};

/** 完整答案：整条算式（无题号时答案页使用） */
export const fullAnswerOf = (problem: Problem): string => {
  if (problem.kind === "rem")
    return `${problem.dividend} ÷ ${problem.divisor} = ${problem.quotient} ${REMAINDER_MARK} ${problem.remainder}`;
  if (problem.kind === "cmp")
    return `${expressionOf(problem.terms, problem.ops)} ${problem.relation} ${problem.value}`;
  return `${expressionOf(problem.terms, problem.ops)} = ${problem.answer}`;
};

const keyOf = (problem: Problem) => `${problem.kind}|${questionTextOf(problem)}`;

// ── 出题形式变换 ────────────────────────────────────────

const toCompare = (problem: EqProblem, rng: Rng): CmpProblem => {
  let value = problem.answer;
  const roll = rng();
  if (roll >= 0.34) {
    // 与正确结果差 1~3 个「档」，档随数量级放大（整百题就差几十）
    const unit = problem.answer >= 1000 ? 100 : problem.answer >= 100 ? 10 : 1;
    const delta = int(rng, 1, 3) * unit;
    value = roll < 0.67 ? problem.answer + delta : Math.max(0, problem.answer - delta);
  }
  const relation = problem.answer > value ? ">" : problem.answer < value ? "<" : "=";
  return { kind: "cmp", terms: problem.terms, ops: problem.ops, value, relation };
};

const availableForms = (preset: Preset): Exclude<ProblemForm, "mixed">[] => {
  const forms: Exclude<ProblemForm, "mixed">[] = ["standard"];
  if (preset.supportsBlank) forms.push("blank");
  if (preset.supportsCompare) forms.push("compare");
  return forms;
};

const applyForm = (base: Problem, preset: Preset, form: ProblemForm, rng: Rng): Problem => {
  if (base.kind !== "eq") return base;
  let effective: Exclude<ProblemForm, "mixed"> = form === "mixed" ? pick(availableForms(preset), rng) : form;
  if (effective === "blank" && !preset.supportsBlank) effective = "standard";
  if (effective === "compare" && !preset.supportsCompare) effective = "standard";
  if (effective === "blank") return { ...base, blank: int(rng, 0, base.terms.length - 1) };
  if (effective === "compare") return toCompare(base, rng);
  return base;
};

// ── 组卷 ────────────────────────────────────────────────

/**
 * 多题型均匀混卷：各题型平分题量后整体洗牌；同卷去重（题型空间太小时允许重复）。
 * 同一 rng（即同一卷号 + 同一设置）永远得到同一份卷子。
 */
export const generateProblems = (
  selected: Preset[],
  form: ProblemForm,
  count: number,
  rng: Rng,
): Problem[] => {
  if (selected.length === 0 || count <= 0) return [];
  const order = shuffle([...selected], rng);
  const assignment: Preset[] = [];
  order.forEach((preset, index) => {
    const share = Math.floor(count / order.length) + (index < count % order.length ? 1 : 0);
    for (let i = 0; i < share; i += 1) assignment.push(preset);
  });
  shuffle(assignment, rng);

  const seen = new Set<string>();
  return assignment.map((preset) => {
    let candidate = applyForm(preset.generate(rng), preset, form, rng);
    for (let attempt = 0; attempt < 40 && seen.has(keyOf(candidate)); attempt += 1) {
      candidate = applyForm(preset.generate(rng), preset, form, rng);
    }
    seen.add(keyOf(candidate));
    return candidate;
  });
};
