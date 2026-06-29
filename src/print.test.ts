import { describe, expect, it } from "vitest";
import { buildPrintableHtml } from "./print";
import type { Problem, SheetSettings } from "./types";

const settings: SheetSettings = {
  fontSize: 32,
  rowGap: 28,
  includeAnswerKey: true,
  showUnderline: true,
};

const problems: Problem[] = [
  { operand1: 3, operator: "+", operand2: 5, answer: 8 },
  { operand1: 9, operator: "÷", operand2: 3, answer: 3 },
];

describe("buildPrintableHtml", () => {
  it("renders question sheets, answer key, print button, and layout styles", () => {
    const html = buildPrintableHtml("测试题", problems, settings);

    expect(html).toContain("测试题");
    expect(html).toContain("3 + 5 =");
    expect(html).toContain("3 + 5 = 8");
    expect(html).toContain("测试题 (参考答案)");
    expect(html).toContain("window.print()");
    expect(html).toContain("row-gap: 28px");
    expect(html).toContain("font-size: 32px");
    expect(html).toContain('class="underline"');
  });

  it("omits answer key and underline when disabled", () => {
    const html = buildPrintableHtml("测试题", problems, {
      ...settings,
      includeAnswerKey: false,
      showUnderline: false,
    });

    expect(html).not.toContain("参考答案");
    expect(html).not.toContain('class="underline"');
  });
});
