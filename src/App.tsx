import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  FileText,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCcw,
  Rows3,
  SlidersHorizontal,
} from "lucide-react";
import {
  clampProblemCount,
  countForPages,
  createProblems,
  expressionOf,
  fullEquationOf,
  generators,
  itemsPerPage,
  pageCountForProblems,
  splitIntoPages,
} from "./math";
import { buildPrintableHtml } from "./print";
import type { MathGenerator, Problem, SheetSettings } from "./types";

const initialGenerator = generators[0];
const initialCount = itemsPerPage;
const defaultSettings: SheetSettings = {
  fontSize: 32,
  rowGap: 32,
  includeAnswerKey: false,
  showUnderline: true,
};
const previewBaseWidth = 794;

const getPreviewScale = () => {
  if (typeof window === "undefined") return 1;
  const horizontalChrome = window.innerWidth <= 720 ? 72 : 132;
  return Math.min(1, Math.max(0.38, (window.innerWidth - horizontalChrome) / previewBaseWidth));
};

function App() {
  const [generator, setGenerator] = useState<MathGenerator>(initialGenerator);
  const [count, setCount] = useState(initialCount);
  const [settings, setSettings] = useState<SheetSettings>(defaultSettings);
  const [problems, setProblems] = useState(() => createProblems(initialGenerator, initialCount));
  const [previewScale, setPreviewScale] = useState(getPreviewScale);

  const pages = useMemo(() => splitIntoPages(problems), [problems]);
  const displaySheets = useMemo(() => {
    if (!settings.includeAnswerKey) return pages.map((items) => ({ items, answer: false }));
    return [
      ...pages.map((items) => ({ items, answer: false })),
      ...pages.map((items) => ({ items, answer: true })),
    ];
  }, [pages, settings.includeAnswerKey]);

  useEffect(() => {
    const updateScale = () => setPreviewScale(getPreviewScale());
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const updateCount = (nextCount: number) => {
    const normalized = clampProblemCount(nextCount);
    setCount(normalized);
    setProblems(createProblems(generator, normalized));
  };

  const updatePages = (nextPages: number) => {
    updateCount(countForPages(nextPages));
  };

  const updateGenerator = (id: string) => {
    const nextGenerator = generators.find((item) => item.id === id) ?? initialGenerator;
    setGenerator(nextGenerator);
    setProblems(createProblems(nextGenerator, count));
  };

  const regenerate = () => {
    setProblems(createProblems(generator, count));
  };

  const printSheet = () => {
    const html = buildPrintableHtml(generator.name, problems, settings);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!printWindow) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="算术题打印生成器首页">
          <span className="brand-mark" aria-hidden="true">
            <Rows3 size={24} />
          </span>
          <span>
            <strong>算术题打印生成器</strong>
            <small>Family Apps</small>
          </span>
        </a>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={regenerate} aria-label="刷新题目">
            <RefreshCcw size={20} />
          </button>
          <button className="primary-button" type="button" onClick={printSheet}>
            <Printer size={20} />
            生成打印页
          </button>
        </div>
      </header>

      <main className="tool-layout">
        <aside className="control-panel" aria-label="题目设置">
          <section className="control-section">
            <div className="section-title">
              <SlidersHorizontal size={18} />
              <h2>题目设置</h2>
            </div>

            <label className="field">
              <span>题目类型</span>
              <select value={generator.id} onChange={(event) => updateGenerator(event.target.value)}>
                {generators.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="helper-text">{generator.description}</p>

            <div className="stepper-row">
              <span>页数</span>
              <div className="stepper">
                <button type="button" onClick={() => updatePages(pageCountForProblems(count) - 1)} aria-label="减少页数">
                  <MinusCircle size={20} />
                </button>
                <input
                  value={pageCountForProblems(count)}
                  inputMode="numeric"
                  aria-label="页数"
                  onChange={(event) => {
                    const next = Number(event.currentTarget.value);
                    if (Number.isFinite(next) && next > 0) updatePages(next);
                  }}
                />
                <button type="button" onClick={() => updatePages(pageCountForProblems(count) + 1)} aria-label="增加页数">
                  <PlusCircle size={20} />
                </button>
              </div>
            </div>

            <div className="metric-row">
              <span>总题目数</span>
              <strong>{count}</strong>
            </div>

            <label className="range-field">
              <span>题量</span>
              <input
                type="range"
                min="15"
                max="990"
                step="15"
                value={count}
                onChange={(event) => updateCount(Number(event.currentTarget.value))}
              />
            </label>
          </section>

          <section className="control-section">
            <div className="section-title">
              <FileText size={18} />
              <h2>排版设置</h2>
            </div>

            <label className="range-field">
              <span>字号 {settings.fontSize}px</span>
              <input
                type="range"
                min="18"
                max="48"
                step="1"
                value={settings.fontSize}
                onChange={(event) => {
                  const fontSize = Number(event.currentTarget.value);
                  setSettings((current) => ({ ...current, fontSize }));
                }}
              />
            </label>

            <label className="range-field">
              <span>行间距 {settings.rowGap}px</span>
              <input
                type="range"
                min="12"
                max="80"
                step="1"
                value={settings.rowGap}
                onChange={(event) => {
                  const rowGap = Number(event.currentTarget.value);
                  setSettings((current) => ({ ...current, rowGap }));
                }}
              />
            </label>

            <label className="toggle-row">
              <span>包含参考答案页</span>
              <input
                type="checkbox"
                checked={settings.includeAnswerKey}
                onChange={(event) => {
                  const includeAnswerKey = event.currentTarget.checked;
                  setSettings((current) => ({ ...current, includeAnswerKey }));
                }}
              />
            </label>

            <label className="toggle-row">
              <span>打印填空横线</span>
              <input
                type="checkbox"
                checked={settings.showUnderline}
                onChange={(event) => {
                  const showUnderline = event.currentTarget.checked;
                  setSettings((current) => ({ ...current, showUnderline }));
                }}
              />
            </label>

            <div className="button-grid">
              <button type="button" onClick={regenerate}>
                <RefreshCcw size={18} />
                刷新题目
              </button>
              <button type="button" className="strong" onClick={printSheet}>
                <Printer size={18} />
                打印 / PDF
              </button>
            </div>
          </section>
        </aside>

        <section className="preview-area" aria-label="A4 预览">
          <div className="preview-header">
            <div>
              <h1>{generator.name}</h1>
              <p>
                {pages.length} 页题目
                {settings.includeAnswerKey ? ` + ${pages.length} 页参考答案` : ""}，每页 {itemsPerPage} 题。
              </p>
            </div>
            <button type="button" onClick={printSheet}>
              <Printer size={18} />
              打印
            </button>
          </div>

          <div className="sheet-stack">
            {displaySheets.map((sheet, index) => (
              <div
                key={`${sheet.answer ? "answer" : "question"}-${index}`}
                className="sheet-frame"
                style={
                  {
                    "--preview-scale": previewScale,
                    width: `${previewBaseWidth * previewScale}px`,
                    height: `${1123 * previewScale}px`,
                  } as CSSProperties
                }
              >
                <PreviewSheet
                  title={sheet.answer ? answerTitle(generator.name, index - pages.length, pages.length) : generator.name}
                  problems={sheet.items}
                  settings={settings}
                  isAnswer={sheet.answer}
                  pageIndex={sheet.answer ? index - pages.length : index}
                  totalPages={pages.length}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function answerTitle(title: string, index: number, total: number) {
  return total === 1 ? `${title} (参考答案)` : `${title} (答案 ${index + 1}/${total})`;
}

function PreviewSheet({
  title,
  problems,
  settings,
  isAnswer,
  pageIndex,
  totalPages,
}: {
  title: string;
  problems: Problem[];
  settings: SheetSettings;
  isAnswer: boolean;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <article
      className={`sheet-preview${isAnswer ? " answer-sheet" : ""}`}
      style={
        {
          "--problem-font-size": `${settings.fontSize}px`,
          "--problem-row-gap": `${settings.rowGap}px`,
          "--underline-width": `${settings.fontSize * 2.5}px`,
        } as CSSProperties
      }
      aria-label={`${title} 第 ${pageIndex + 1} 页`}
    >
      <header className="sheet-title">
        <h2>{title}</h2>
        {!isAnswer && (
          <div className="sheet-meta">
            <span>日期: ____________</span>
            <span>用时: ____________</span>
            <span>得分: ____________</span>
          </div>
        )}
      </header>
      <div className="problem-grid">
        {problems.map((problem, index) => (
          <div className={`problem-item${isAnswer ? " answer" : ""}`} key={`${index}-${fullEquationOf(problem)}`}>
            {isAnswer ? fullEquationOf(problem) : `${expressionOf(problem)} =`}
            {!isAnswer && settings.showUnderline && <span className="answer-line" />}
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <footer className="page-number">
          第 {pageIndex + 1} 页 / 共 {totalPages} 页{isAnswer ? "答案" : ""}
        </footer>
      )}
    </article>
  );
}

export default App;
