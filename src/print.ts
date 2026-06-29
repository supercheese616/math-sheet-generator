import { expressionOf, fullEquationOf, itemsPerPage, splitIntoPages } from "./math";
import type { Problem, SheetSettings } from "./types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const problemHtml = (problem: Problem, settings: SheetSettings, isAnswer: boolean) => {
  if (isAnswer) {
    return `<div class="problem answer">${escapeHtml(fullEquationOf(problem))}</div>`;
  }

  return `
    <div class="problem">
      ${escapeHtml(expressionOf(problem))} = ${settings.showUnderline ? '<span class="underline"></span>' : ""}
    </div>
  `;
};

const sheetHtml = (
  title: string,
  pageProblems: Problem[],
  settings: SheetSettings,
  isAnswer: boolean,
  pageLabel?: string,
) => `
  <section class="sheet ${isAnswer ? "answer-key" : ""}">
    <header class="sheet-header">
      <h1>${escapeHtml(pageLabel ?? title)}</h1>
      ${
        isAnswer
          ? ""
          : `<div class="meta">
              <span>日期: ____________</span>
              <span>用时: ____________</span>
              <span>得分: ____________</span>
            </div>`
      }
    </header>
    <div class="problem-grid">
      ${pageProblems.map((problem) => problemHtml(problem, settings, isAnswer)).join("\n")}
    </div>
  </section>
`;

export const buildPrintableHtml = (title: string, problems: Problem[], settings: SheetSettings) => {
  const pages = splitIntoPages(problems, itemsPerPage);
  const answerPages = settings.includeAnswerKey ? pages : [];

  const body = [
    ...pages.map((page) => sheetHtml(title, page, settings, false)),
    ...answerPages.map((page, index) => {
      const label = pages.length === 1 ? `${title} (参考答案)` : `${title} (答案 ${index + 1}/${pages.length})`;
      return sheetHtml(title, page, settings, true, label);
    }),
  ].join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f2f4f7;
      color: #111827;
      font-family: "Times New Roman", "SimSun", serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 15mm;
      background: #fff;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
    }

    .sheet-header {
      text-align: center;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 2px solid #111827;
    }

    .sheet-header h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
      color: #4b5563;
      font-size: 14px;
    }

    .problem-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      column-gap: 10mm;
      row-gap: ${settings.rowGap}px;
    }

    .problem {
      display: flex;
      align-items: baseline;
      white-space: nowrap;
      font-size: ${settings.fontSize}px;
      line-height: 1.1;
    }

    .underline {
      display: inline-block;
      width: ${settings.fontSize * 2.5}px;
      height: 0.75em;
      margin-left: 5px;
      border-bottom: 2px solid #111827;
    }

    .answer-key .sheet-header {
      border-bottom: 1px dashed #6b7280;
    }

    .answer {
      color: #374151;
    }

    .print-button {
      position: fixed;
      right: 22px;
      bottom: 22px;
      border: 0;
      border-radius: 8px;
      padding: 11px 18px;
      color: #fff;
      background: #1f7a8c;
      font: 600 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 10px 24px rgba(31, 122, 140, 0.28);
      cursor: pointer;
    }

    @media print {
      body {
        background: #fff;
      }

      .sheet {
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
        break-after: page;
        page-break-after: always;
      }

      .sheet:last-of-type {
        break-after: auto;
        page-break-after: auto;
      }

      .print-button {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${body}
  <button class="print-button" type="button" onclick="window.print()">打印 / 存为 PDF</button>
</body>
</html>`;
};
