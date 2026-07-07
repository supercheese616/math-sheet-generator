import { describe, expect, it } from "vitest";
import {
  evaluate,
  fullAnswerOf,
  generateProblems,
  presetById,
  presets,
  questionTextOf,
  shortAnswerOf,
} from "./engine";
import { answersPerPage, chunk, FONT_SIZES, GAP_FACTORS, layoutFor, maxColumnsFor } from "./layout";
import { normalizeSeed, rngFromSeed } from "./rng";
import type { EqProblem, Preset, Problem, SheetSettings } from "./types";

const preset = (id: string): Preset => {
  const found = presetById(id);
  if (!found) throw new Error(`missing preset: ${id}`);
  return found;
};

const sample = (id: string, count = 500, seed = "TEST"): Problem[] => {
  const rng = rngFromSeed(seed);
  return Array.from({ length: count }, () => preset(id).generate(rng));
};

const eqSample = (id: string, count = 500): EqProblem[] =>
  sample(id, count).map((problem) => {
    if (problem.kind !== "eq") throw new Error("expected eq problem");
    return problem;
  });

const ones = (n: number) => n % 10;
const tens = (n: number) => Math.floor(n / 10);

describe("evaluate", () => {
  it("honors multiplication precedence", () => {
    expect(evaluate([2, 3, 4], ["+", "×"])).toBe(14);
    expect(evaluate([6, 7, 5], ["×", "-"])).toBe(37);
    expect(evaluate([20, 5, 3], ["-", "+"])).toBe(18);
  });
});

describe("一年级题型", () => {
  it("10以内加减法范围正确", () => {
    for (const p of eqSample("add-10")) {
      expect(p.ops).toEqual(["+"]);
      expect(p.answer).toBe(p.terms[0] + p.terms[1]);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThanOrEqual(10);
    }
    for (const p of eqSample("sub-10")) {
      expect(p.ops).toEqual(["-"]);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.terms[0]).toBeLessThanOrEqual(10);
    }
  });

  it("20以内不进位加法：十几加几，个位不进位", () => {
    for (const p of eqSample("add-20-nocarry")) {
      const [big, small] = p.terms[0] >= 10 ? p.terms : [p.terms[1], p.terms[0]];
      expect(big).toBeGreaterThanOrEqual(10);
      expect(big).toBeLessThanOrEqual(19);
      expect(small).toBeLessThanOrEqual(9);
      expect(ones(big) + small).toBeLessThanOrEqual(9);
      expect(p.answer).toBeLessThanOrEqual(19);
    }
  });

  it("20以内进位加法：两个一位数相加必进位", () => {
    for (const p of eqSample("add-20-carry")) {
      expect(p.terms[0]).toBeLessThanOrEqual(9);
      expect(p.terms[1]).toBeLessThanOrEqual(9);
      expect(p.terms[0] + p.terms[1]).toBeGreaterThanOrEqual(11);
      expect(p.answer).toBeLessThanOrEqual(18);
    }
  });

  it("20以内退位减法：十几减一位数必退位", () => {
    for (const p of eqSample("sub-20-borrow")) {
      expect(p.terms[0]).toBeGreaterThanOrEqual(10);
      expect(p.terms[0]).toBeLessThanOrEqual(18);
      expect(ones(p.terms[0])).toBeLessThan(p.terms[1]);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeLessThanOrEqual(9);
    }
  });

  it("20以内连加连减：中间结果不越界", () => {
    for (const p of eqSample("chain-20")) {
      expect(p.terms).toHaveLength(3);
      let acc = p.terms[0];
      for (let i = 0; i < p.ops.length; i += 1) {
        acc = p.ops[i] === "+" ? acc + p.terms[i + 1] : acc - p.terms[i + 1];
        expect(acc).toBeGreaterThanOrEqual(0);
        expect(acc).toBeLessThanOrEqual(20);
      }
      expect(acc).toBe(p.answer);
    }
  });
});

describe("二年级题型", () => {
  it("100以内进位/不进位加法的个位条件", () => {
    for (const p of eqSample("add-100-nocarry")) {
      expect(ones(p.terms[0]) + ones(p.terms[1])).toBeLessThanOrEqual(9);
      expect(p.answer).toBeLessThanOrEqual(99);
      expect(p.terms[0]).toBeGreaterThanOrEqual(10);
      expect(p.terms[1]).toBeGreaterThanOrEqual(10);
    }
    for (const p of eqSample("add-100-carry")) {
      expect(ones(p.terms[0]) + ones(p.terms[1])).toBeGreaterThanOrEqual(10);
      expect(p.answer).toBeLessThanOrEqual(100);
      expect(p.terms[0]).toBeGreaterThanOrEqual(10);
      expect(p.terms[1]).toBeGreaterThanOrEqual(10);
    }
  });

  it("100以内退位/不退位减法的借位条件", () => {
    for (const p of eqSample("sub-100-noborrow")) {
      expect(ones(p.terms[0])).toBeGreaterThanOrEqual(ones(p.terms[1]));
      expect(tens(p.terms[0])).toBeGreaterThanOrEqual(tens(p.terms[1]));
      expect(p.terms[1]).toBeGreaterThan(0);
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
    for (const p of eqSample("sub-100-borrow")) {
      expect(ones(p.terms[0])).toBeLessThan(ones(p.terms[1]));
      expect(p.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("表内乘除法在口诀范围内", () => {
    for (const p of eqSample("mul-table")) {
      expect(p.terms[0]).toBeGreaterThanOrEqual(1);
      expect(p.terms[0]).toBeLessThanOrEqual(9);
      expect(p.terms[1]).toBeGreaterThanOrEqual(1);
      expect(p.terms[1]).toBeLessThanOrEqual(9);
    }
    for (const p of eqSample("div-table")) {
      expect(p.terms[0] % p.terms[1]).toBe(0);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeLessThanOrEqual(9);
    }
  });

  it("乘加乘减先乘后算且结果非负", () => {
    for (const p of eqSample("mul-add")) {
      expect(p.ops[0]).toBe("×");
      expect(p.answer).toBe(evaluate(p.terms, p.ops));
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThanOrEqual(90);
    }
  });
});

describe("三年级题型", () => {
  it("有余数除法：余数小于除数且不为 0", () => {
    for (const p of sample("div-remainder")) {
      if (p.kind !== "rem") throw new Error("expected rem problem");
      expect(p.remainder).toBeGreaterThanOrEqual(1);
      expect(p.remainder).toBeLessThan(p.divisor);
      expect(p.dividend).toBe(p.divisor * p.quotient + p.remainder);
    }
  });

  it("整十整百乘一位数", () => {
    for (const p of eqSample("mul-round")) {
      const round = Math.max(p.terms[0], p.terms[1]);
      expect(round % 10).toBe(0);
      expect(p.answer).toBe(p.terms[0] * p.terms[1]);
    }
  });

  it("整十数加减在 1000 以内且非负", () => {
    for (const p of eqSample("add-sub-round")) {
      expect(p.terms[0] % 10).toBe(0);
      expect(p.terms[1] % 10).toBe(0);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThanOrEqual(1000);
    }
  });
});

describe("组卷", () => {
  it("同一卷号生成完全相同的卷子", () => {
    const selected = [preset("add-20-carry"), preset("sub-20-borrow")];
    const a = generateProblems(selected, "mixed", 90, rngFromSeed("ABC123"));
    const b = generateProblems(selected, "mixed", 90, rngFromSeed("ABC123"));
    const c = generateProblems(selected, "mixed", 90, rngFromSeed("XYZ789"));
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it("多题型均匀混合", () => {
    const selected = [preset("mul-table"), preset("div-table")];
    const problems = generateProblems(selected, "standard", 90, rngFromSeed("MIX"));
    const mul = problems.filter((p) => p.kind === "eq" && p.ops[0] === "×").length;
    expect(mul).toBe(45);
    expect(problems).toHaveLength(90);
  });

  it("题目空间足够时同卷不重题", () => {
    const problems = generateProblems([preset("add-100-carry")], "standard", 80, rngFromSeed("DEDUP"));
    const keys = new Set(problems.map((p) => questionTextOf(p)));
    expect(keys.size).toBe(80);
  });

  it("题目空间太小时允许重复但不会死循环", () => {
    const problems = generateProblems([preset("add-10")], "standard", 200, rngFromSeed("SMALL"));
    expect(problems).toHaveLength(200);
  });

  it("求未知数形式：空位合法且隐藏值正确", () => {
    const problems = generateProblems([preset("add-20-carry")], "blank", 60, rngFromSeed("BLANK"));
    for (const p of problems) {
      if (p.kind !== "eq") throw new Error("expected eq");
      expect(p.blank).toBeGreaterThanOrEqual(0);
      expect(p.blank).toBeLessThan(p.terms.length);
      expect(questionTextOf(p)).toContain("□");
      expect(shortAnswerOf(p)).toBe(String(p.terms[p.blank]));
    }
  });

  it("比大小形式：关系符号与实际大小一致", () => {
    const problems = generateProblems([preset("mul-table")], "compare", 60, rngFromSeed("CMP"));
    for (const p of problems) {
      if (p.kind !== "cmp") throw new Error("expected cmp");
      const left = evaluate(p.terms, p.ops);
      const expected = left > p.value ? ">" : left < p.value ? "<" : "=";
      expect(p.relation).toBe(expected);
      expect(p.value).toBeGreaterThanOrEqual(0);
    }
  });

  it("不支持变式的题型在混合形式下回退标准形式", () => {
    const problems = generateProblems([preset("div-remainder")], "mixed", 40, rngFromSeed("REM"));
    for (const p of problems) expect(p.kind).toBe("rem");
  });
});

describe("渲染文本", () => {
  it("标准 / 求未知数 / 比大小 / 有余数的题面与答案", () => {
    const std: Problem = { kind: "eq", terms: [8, 7], ops: ["+"], answer: 15, blank: 2 };
    expect(questionTextOf(std)).toBe("8 + 7 =");
    expect(shortAnswerOf(std)).toBe("15");
    expect(fullAnswerOf(std)).toBe("8 + 7 = 15");

    const blank: Problem = { kind: "eq", terms: [8, 7], ops: ["+"], answer: 15, blank: 1 };
    expect(questionTextOf(blank)).toBe("8 + □ = 15");
    expect(shortAnswerOf(blank)).toBe("7");

    const cmp: Problem = { kind: "cmp", terms: [6, 7], ops: ["×"], value: 40, relation: ">" };
    expect(questionTextOf(cmp)).toBe("6 × 7 ○ 40");
    expect(shortAnswerOf(cmp)).toBe(">");

    const rem: Problem = { kind: "rem", dividend: 17, divisor: 5, quotient: 3, remainder: 2 };
    expect(questionTextOf(rem)).toBe("17 ÷ 5 = □ …… □");
    expect(shortAnswerOf(rem)).toBe("3 …… 2");
    expect(fullAnswerOf(rem)).toBe("17 ÷ 5 = 3 …… 2");
  });
});

describe("自动排版", () => {
  const baseSettings: SheetSettings = {
    presetIds: ["add-20-carry"],
    form: "standard",
    pages: 1,
    columns: 3,
    fontSize: "m",
    rowGap: "normal",
    numbered: true,
    underline: true,
    answerKey: false,
    title: "",
    seed: "TEST",
  };

  it("每页题数为正且行高计算不超出可用高度", () => {
    for (const fontSize of ["s", "m", "l"] as const) {
      for (const rowGap of ["compact", "normal", "loose"] as const) {
        const layout = layoutFor({ ...baseSettings, fontSize, rowGap }, [preset("add-20-carry")], "standard");
        expect(layout.perPage).toBeGreaterThan(0);
        const rowHeight = Math.ceil(FONT_SIZES[fontSize] * 1.15);
        const gap = Math.round(FONT_SIZES[fontSize] * GAP_FACTORS[rowGap]);
        const contentHeight = layout.rows * rowHeight + (layout.rows - 1) * gap;
        expect(contentHeight).toBeLessThanOrEqual(1123 - 112 - 100);
      }
    }
  });

  it("宽算式、大字号与宽形式限制列数", () => {
    expect(maxColumnsFor([preset("add-20-carry")], "m", "standard")).toBe(4);
    expect(maxColumnsFor([preset("add-20-carry")], "l", "standard")).toBe(3);
    // 比大小/求未知数题面更宽：100以内 中字号从 4 列降到 3 列
    expect(maxColumnsFor([preset("add-100-carry")], "m", "standard")).toBe(4);
    expect(maxColumnsFor([preset("add-100-carry")], "m", "compare")).toBe(3);
    expect(maxColumnsFor([preset("add-100-carry")], "l", "compare")).toBe(2);
    // 有余数除法（xlong）：中字号最多 2 列
    expect(maxColumnsFor([preset("div-remainder")], "m", "standard")).toBe(2);
    expect(maxColumnsFor([preset("div-remainder")], "l", "standard")).toBe(2);
    expect(maxColumnsFor([preset("div-remainder")], "s", "standard")).toBe(3);
    // 连加连减（long）+ 比大小 中字号：2 列
    expect(maxColumnsFor([preset("chain-20")], "m", "compare")).toBe(2);
    // 整十整百乘一位数：积可达四位数，按 long 限列
    expect(maxColumnsFor([preset("mul-round")], "m", "standard")).toBe(3);
    expect(maxColumnsFor([preset("mul-round")], "m", "compare")).toBe(2);
    const layout = layoutFor({ ...baseSettings, columns: 4, fontSize: "l" }, [preset("add-20-carry")], "standard");
    expect(layout.columns).toBe(3);
  });

  it("答案页容量与分页", () => {
    expect(answersPerPage(true)).toBeGreaterThan(answersPerPage(false));
    expect(chunk(Array.from({ length: 91 }), 45).map((page) => page.length)).toEqual([45, 45, 1]);
  });
});

describe("卷号", () => {
  it("规范化只保留大写字母数字并限长", () => {
    expect(normalizeSeed("ab-12 cd!")).toBe("AB12CD");
    expect(normalizeSeed("abcdefghijk")).toHaveLength(8);
  });

  it("题型目录 id 唯一", () => {
    expect(new Set(presets.map((p) => p.id)).size).toBe(presets.length);
  });
});
