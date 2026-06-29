import { describe, expect, it } from "vitest";
import { countForPages, generators, itemsPerPage, pageCountForProblems, splitIntoPages } from "./math";

const sample = (id: string, count = 500) => {
  const generator = generators.find((item) => item.id === id);
  if (!generator) throw new Error(`missing generator: ${id}`);
  return Array.from({ length: count }, () => generator.generate());
};

describe("math generators", () => {
  it("keeps addition under 20 within range", () => {
    for (const problem of sample("addition-under-20")) {
      expect(problem.operator).toBe("+");
      expect(problem.answer).toBe(problem.operand1 + problem.operand2);
      expect(problem.answer).toBeLessThanOrEqual(20);
      expect(problem.operand1).toBeGreaterThanOrEqual(0);
      expect(problem.operand2).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps mixed under 20 answers non-negative and no greater than 20", () => {
    for (const problem of sample("mixed-under-20")) {
      expect(problem.answer).toBe(problem.operator === "+" ? problem.operand1 + problem.operand2 : problem.operand1 - problem.operand2);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
      expect(problem.answer).toBeLessThanOrEqual(20);
    }
  });

  it("generates subtraction without borrowing under 100", () => {
    for (const problem of sample("no-borrow-subtraction-under-100")) {
      expect(problem.operator).toBe("-");
      expect(problem.answer).toBe(problem.operand1 - problem.operand2);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
      expect(problem.operand1 % 10).toBeGreaterThanOrEqual(problem.operand2 % 10);
      expect(Math.floor(problem.operand1 / 10)).toBeGreaterThanOrEqual(Math.floor(problem.operand2 / 10));
    }
  });

  it("keeps mixed under 100 answers in range", () => {
    for (const problem of sample("mixed-under-100")) {
      expect(problem.answer).toBe(problem.operator === "+" ? problem.operand1 + problem.operand2 : problem.operand1 - problem.operand2);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
      expect(problem.answer).toBeLessThan(100);
    }
  });

  it("generates multiplication and exact division table practice", () => {
    for (const problem of sample("multiplication-table")) {
      expect(problem.operator).toBe("×");
      expect(problem.operand1).toBeGreaterThanOrEqual(1);
      expect(problem.operand1).toBeLessThanOrEqual(9);
      expect(problem.operand2).toBeGreaterThanOrEqual(1);
      expect(problem.operand2).toBeLessThanOrEqual(9);
      expect(problem.answer).toBe(problem.operand1 * problem.operand2);
    }

    for (const problem of sample("division-table")) {
      expect(problem.operator).toBe("÷");
      expect(problem.operand1 % problem.operand2).toBe(0);
      expect(problem.answer).toBe(problem.operand1 / problem.operand2);
      expect(problem.answer).toBeGreaterThanOrEqual(1);
      expect(problem.answer).toBeLessThanOrEqual(9);
    }
  });
});

describe("pagination helpers", () => {
  it("uses 45 problems per page and caps page count at 990 problems", () => {
    expect(itemsPerPage).toBe(45);
    expect(countForPages(1)).toBe(45);
    expect(countForPages(22)).toBe(990);
    expect(countForPages(99)).toBe(990);
    expect(pageCountForProblems(60)).toBe(2);
    expect(splitIntoPages(Array.from({ length: 91 })).map((page) => page.length)).toEqual([45, 45, 1]);
  });
});
