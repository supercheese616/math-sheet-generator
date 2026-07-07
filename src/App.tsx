import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BookOpenCheck,
  Dices,
  FileText,
  Minus,
  Plus,
  Printer,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import {
  fullAnswerOf,
  generateProblems,
  isStandardEq,
  presetGroups,
  presets,
  questionTextOf,
  shortAnswerOf,
} from "./engine";
import {
  ANSWER_FONT_SIZE,
  ANSWER_ROW_GAP,
  answerColumns,
  answersPerPage,
  chunk,
  layoutFor,
  maxColumnsFor,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  type SheetLayout,
} from "./layout";
import { normalizeSeed, randomSeed, rngFromSeed } from "./rng";
import type { GapKey, Problem, ProblemForm, SheetSettings, SizeKey } from "./types";

const STORAGE_KEY = "math-sheet:v2";
const MAX_PAGES = 10;

const defaultSettings: SheetSettings = {
  presetIds: ["add-20-carry", "sub-20-borrow"],
  form: "standard",
  pages: 1,
  columns: 3,
  fontSize: "m",
  rowGap: "normal",
  numbered: true,
  underline: true,
  answerKey: false,
  title: "",
  seed: "",
};

const FORM_OPTIONS: { id: ProblemForm; label: string; hint: string }[] = [
  { id: "standard", label: "标准", hint: "8 + 7 = ____" },
  { id: "blank", label: "求未知数", hint: "8 + □ = 15" },
  { id: "compare", label: "比大小", hint: "8 + 7 ○ 16" },
  { id: "mixed", label: "混合", hint: "以上形式随机穿插" },
];

const SIZE_OPTIONS: { id: SizeKey; label: string }[] = [
  { id: "s", label: "小" },
  { id: "m", label: "中" },
  { id: "l", label: "大" },
];

const GAP_OPTIONS: { id: GapKey; label: string }[] = [
  { id: "compact", label: "紧凑" },
  { id: "normal", label: "标准" },
  { id: "loose", label: "宽松" },
];

const loadSettings = (): SheetSettings => {
  const merged = { ...defaultSettings };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SheetSettings>;
      Object.assign(merged, parsed);
    }
  } catch {
    // 存储损坏时静默回退默认值
  }
  merged.presetIds = (Array.isArray(merged.presetIds) ? merged.presetIds : []).filter((id) =>
    presets.some((preset) => preset.id === id),
  );
  if (merged.presetIds.length === 0) merged.presetIds = [...defaultSettings.presetIds];
  if (!FORM_OPTIONS.some((option) => option.id === merged.form)) merged.form = "standard";
  if (![2, 3, 4].includes(merged.columns)) merged.columns = 3;
  if (!SIZE_OPTIONS.some((option) => option.id === merged.fontSize)) merged.fontSize = "m";
  if (!GAP_OPTIONS.some((option) => option.id === merged.rowGap)) merged.rowGap = "normal";
  merged.pages = Math.min(MAX_PAGES, Math.max(1, Math.round(Number(merged.pages) || 1)));
  merged.title = typeof merged.title === "string" ? merged.title : "";
  merged.seed = normalizeSeed(typeof merged.seed === "string" ? merged.seed : "");
  return merged;
};

const initSettings = (): SheetSettings => {
  const settings = loadSettings();
  const urlSeed = normalizeSeed(new URLSearchParams(window.location.search).get("s") ?? "");
  settings.seed = urlSeed || settings.seed || randomSeed();
  return settings;
};

const previewBaseWidth = PAGE_WIDTH;

const getPreviewScale = () => {
  if (typeof window === "undefined") return 1;
  const horizontalChrome = window.innerWidth <= 720 ? 56 : 132;
  return Math.min(1, Math.max(0.38, (window.innerWidth - horizontalChrome) / previewBaseWidth));
};

function App() {
  const [settings, setSettings] = useState<SheetSettings>(initSettings);
  const [previewScale, setPreviewScale] = useState(getPreviewScale);
  const [overflowing, setOverflowing] = useState(false);
  const sheetStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // 隐私模式等场景下存不进去就算了
    }
  }, [settings]);

  useEffect(() => {
    const updateScale = () => setPreviewScale(getPreviewScale());
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const selected = useMemo(
    () => presets.filter((preset) => settings.presetIds.includes(preset.id)),
    [settings.presetIds],
  );

  const anyBlank = selected.some((preset) => preset.supportsBlank);
  const anyCompare = selected.some((preset) => preset.supportsCompare);
  const effectiveForm: ProblemForm =
    (settings.form === "blank" && !anyBlank) || (settings.form === "compare" && !anyCompare)
      ? "standard"
      : settings.form;

  const layout = useMemo(
    () => layoutFor(settings, selected, effectiveForm),
    [settings, selected, effectiveForm],
  );
  const columnCap = maxColumnsFor(selected, settings.fontSize, effectiveForm);
  const totalProblems = layout.perPage * settings.pages;

  const problems = useMemo(
    () => generateProblems(selected, effectiveForm, totalProblems, rngFromSeed(settings.seed)),
    [selected, effectiveForm, totalProblems, settings.seed],
  );

  const questionPages = useMemo(() => chunk(problems, layout.perPage), [problems, layout.perPage]);
  const answerPages = useMemo(
    () => (settings.answerKey ? chunk(problems, answersPerPage(settings.numbered)) : []),
    [problems, settings.answerKey, settings.numbered],
  );

  const autoTitle = useMemo(() => {
    if (selected.length === 1) return selected[0].name;
    const groups = [...new Set(selected.map((preset) => preset.group))];
    return groups.length === 1 ? `${groups[0]}口算综合练习` : "口算综合练习";
  }, [selected]);
  const sheetTitle = settings.title.trim() || autoTitle;

  // 排版数学上已保证不溢出，这里是实测兜底：万一真的超出 A4（纵向或横向被裁）就亮警告
  useLayoutEffect(() => {
    const stack = sheetStackRef.current;
    if (!stack) return;
    const sheets = Array.from(stack.querySelectorAll<HTMLElement>(".sheet-preview"));
    setOverflowing(
      sheets.some(
        (el) =>
          Math.max(el.scrollHeight, el.clientHeight) > PAGE_HEIGHT + 1 ||
          el.scrollWidth > el.clientWidth + 1,
      ),
    );
  }, [questionPages, answerPages, settings, previewScale]);

  const togglePreset = (id: string) =>
    setSettings((current) => {
      const has = current.presetIds.includes(id);
      if (has && current.presetIds.length === 1) return current; // 至少保留一种题型
      return {
        ...current,
        presetIds: has
          ? current.presetIds.filter((presetId) => presetId !== id)
          : [...current.presetIds, id],
      };
    });

  const patch = (partial: Partial<SheetSettings>) =>
    setSettings((current) => ({ ...current, ...partial }));

  const updatePages = (next: number) =>
    patch({ pages: Math.min(MAX_PAGES, Math.max(1, Math.round(next))) });

  const rerollSeed = () => patch({ seed: randomSeed() });

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="口算工坊首页">
          <span className="brand-mark" aria-hidden="true">
            <i>+</i>
            <i>−</i>
            <i>×</i>
            <i>÷</i>
          </span>
          <span className="brand-text">
            <strong>口算工坊</strong>
            <small>Math Sheet Studio</small>
          </span>
        </a>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={rerollSeed} title="换一批题（新卷号）">
            <Dices size={20} />
            <span className="icon-button-label">换一批</span>
          </button>
          <button className="primary-button" type="button" onClick={() => window.print()}>
            <Printer size={20} />
            打印
          </button>
        </div>
      </header>

      <main className="tool-layout">
        <aside className="control-panel" aria-label="出卷设置">
          <section className="control-section">
            <div className="section-title">
              <BookOpenCheck size={18} />
              <h2>题型</h2>
              <span className="section-badge">{selected.length} 种</span>
            </div>

            {presetGroups.map((group) => (
              <div className="preset-group" key={group}>
                <h3>{group}</h3>
                <div className="chip-grid">
                  {presets
                    .filter((preset) => preset.group === group)
                    .map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="chip"
                        aria-pressed={settings.presetIds.includes(preset.id)}
                        title={preset.description}
                        onClick={() => togglePreset(preset.id)}
                      >
                        {preset.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
            <p className="helper-text">选中多种题型时会均匀混合、随机穿插出题。</p>

            <div className="field-label">出题形式</div>
            <div className="segmented" role="group" aria-label="出题形式">
              {FORM_OPTIONS.map((option) => {
                const unavailable =
                  (option.id === "blank" && !anyBlank) || (option.id === "compare" && !anyCompare);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={effectiveForm === option.id}
                    disabled={unavailable}
                    title={unavailable ? "当前所选题型不支持该形式" : option.hint}
                    onClick={() => patch({ form: option.id })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="helper-text">{FORM_OPTIONS.find((option) => option.id === effectiveForm)?.hint}</p>
          </section>

          <section className="control-section">
            <div className="section-title">
              <FileText size={18} />
              <h2>试卷</h2>
            </div>

            <label className="field">
              <span>卷名（留空自动命名）</span>
              <input
                type="text"
                value={settings.title}
                placeholder={autoTitle}
                maxLength={20}
                onChange={(event) => patch({ title: event.currentTarget.value })}
              />
            </label>

            <div className="stepper-row">
              <span>页数</span>
              <div className="stepper">
                <button type="button" onClick={() => updatePages(settings.pages - 1)} aria-label="减少页数">
                  <Minus size={18} />
                </button>
                <input
                  value={settings.pages}
                  inputMode="numeric"
                  aria-label="页数"
                  onChange={(event) => {
                    const next = Number(event.currentTarget.value);
                    if (Number.isFinite(next) && next > 0) updatePages(next);
                  }}
                />
                <button type="button" onClick={() => updatePages(settings.pages + 1)} aria-label="增加页数">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="metric-row">
              <span>
                每页 {layout.perPage} 题 × {settings.pages} 页
              </span>
              <strong>{totalProblems} 题</strong>
            </div>

            <label className="field seed-field">
              <span>卷号（同一卷号可重印同一份卷子）</span>
              <span className="seed-input-row">
                <input
                  type="text"
                  value={settings.seed}
                  spellCheck={false}
                  aria-label="卷号"
                  onChange={(event) => patch({ seed: normalizeSeed(event.currentTarget.value) })}
                  onBlur={() => {
                    if (!settings.seed) rerollSeed();
                  }}
                />
                <button type="button" className="dice-button" onClick={rerollSeed} title="随机换一个卷号">
                  <Dices size={18} />
                </button>
              </span>
            </label>
          </section>

          <section className="control-section">
            <div className="section-title">
              <SlidersHorizontal size={18} />
              <h2>排版</h2>
            </div>

            <div className="field-label">列数</div>
            <div className="segmented" role="group" aria-label="列数">
              {[2, 3, 4].map((columns) => (
                <button
                  key={columns}
                  type="button"
                  aria-pressed={layout.columns === columns}
                  disabled={columns > columnCap}
                  title={columns > columnCap ? "当前题型宽度/字号放不下这么多列" : undefined}
                  onClick={() => patch({ columns: columns as SheetSettings["columns"] })}
                >
                  {columns} 列
                </button>
              ))}
            </div>
            {settings.columns > columnCap && (
              <p className="helper-text">宽算式 / 大字号下已自动调整为 {columnCap} 列。</p>
            )}

            <div className="field-label">字号</div>
            <div className="segmented" role="group" aria-label="字号">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={settings.fontSize === option.id}
                  onClick={() => patch({ fontSize: option.id })}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="field-label">行距</div>
            <div className="segmented" role="group" aria-label="行距">
              {GAP_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={settings.rowGap === option.id}
                  onClick={() => patch({ rowGap: option.id })}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="toggle-row">
              <span>题号</span>
              <input
                type="checkbox"
                checked={settings.numbered}
                onChange={(event) => patch({ numbered: event.currentTarget.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>答题横线</span>
              <input
                type="checkbox"
                checked={settings.underline}
                onChange={(event) => patch({ underline: event.currentTarget.checked })}
              />
            </label>
            <label className="toggle-row">
              <span>参考答案页（紧凑排版）</span>
              <input
                type="checkbox"
                checked={settings.answerKey}
                onChange={(event) => patch({ answerKey: event.currentTarget.checked })}
              />
            </label>
          </section>
        </aside>

        <section className="preview-area" aria-label="A4 预览">
          <div className="preview-header">
            <div>
              <h1>{sheetTitle}</h1>
              <p>
                {selected.length} 种题型 · 每页 {layout.perPage} 题 × {settings.pages} 页 = {totalProblems} 题
                {settings.answerKey ? ` · 答案 ${answerPages.length} 页` : ""}
                <span className="seed-tag">卷号 {settings.seed}</span>
              </p>
              {overflowing && (
                <p className="overflow-warning" role="alert">
                  <TriangleAlert size={16} aria-hidden="true" />
                  预览实测超出了 A4 页面，请减少列数或调小字号/行距。
                </p>
              )}
            </div>
          </div>

          <div className="sheet-stack" ref={sheetStackRef}>
            {questionPages.map((page, pageIndex) => (
              <SheetFrame key={`q-${settings.seed}-${pageIndex}`} scale={previewScale}>
                <QuestionSheet
                  title={sheetTitle}
                  problems={page}
                  startIndex={pageIndex * layout.perPage}
                  layout={layout}
                  numbered={settings.numbered}
                  underline={settings.underline}
                  seed={settings.seed}
                  pageIndex={pageIndex}
                  totalPages={questionPages.length}
                />
              </SheetFrame>
            ))}
            {answerPages.map((page, pageIndex) => (
              <SheetFrame key={`a-${settings.seed}-${pageIndex}`} scale={previewScale}>
                <AnswerSheet
                  title={sheetTitle}
                  problems={page}
                  startIndex={pageIndex * answersPerPage(settings.numbered)}
                  numbered={settings.numbered}
                  seed={settings.seed}
                  pageIndex={pageIndex}
                  totalPages={answerPages.length}
                />
              </SheetFrame>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SheetFrame({ scale, children }: { scale: number; children: React.ReactNode }) {
  return (
    <div
      className="sheet-frame"
      style={
        {
          "--preview-scale": scale,
          width: `${PAGE_WIDTH * scale}px`,
          height: `${PAGE_HEIGHT * scale}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

function SheetHeader({ title, withMeta }: { title: string; withMeta: boolean }) {
  return (
    <header className="sheet-title">
      <h2>{title}</h2>
      {withMeta ? (
        <div className="sheet-meta">
          <span>姓名: ________</span>
          <span>日期: ________</span>
          <span>用时: ________</span>
          <span>得分: ________</span>
        </div>
      ) : (
        <div className="sheet-meta">
          <span>参考答案</span>
        </div>
      )}
    </header>
  );
}

function QuestionSheet({
  title,
  problems,
  startIndex,
  layout,
  numbered,
  underline,
  seed,
  pageIndex,
  totalPages,
}: {
  title: string;
  problems: Problem[];
  startIndex: number;
  layout: SheetLayout;
  numbered: boolean;
  underline: boolean;
  seed: string;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <article
      className="sheet-preview"
      style={
        {
          "--problem-font-size": `${layout.fontSize}px`,
          "--problem-row-gap": `${layout.rowGap}px`,
          "--problem-columns": layout.columns,
        } as CSSProperties
      }
      aria-label={`${title} 第 ${pageIndex + 1} 页`}
    >
      <SheetHeader title={title} withMeta />
      <div className="problem-grid">
        {problems.map((problem, index) => (
          <div className="problem-item" key={`${startIndex + index}-${questionTextOf(problem)}`}>
            {numbered && <span className="problem-no">{startIndex + index + 1}.</span>}
            <span className="problem-text">{questionTextOf(problem)}</span>
            {underline && isStandardEq(problem) && <span className="answer-line" />}
          </div>
        ))}
      </div>
      <footer className="page-number">
        第 {pageIndex + 1} / {totalPages} 页 · 卷号 {seed}
      </footer>
    </article>
  );
}

function AnswerSheet({
  title,
  problems,
  startIndex,
  numbered,
  seed,
  pageIndex,
  totalPages,
}: {
  title: string;
  problems: Problem[];
  startIndex: number;
  numbered: boolean;
  seed: string;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <article
      className="sheet-preview answer-sheet"
      style={
        {
          "--answer-font-size": `${ANSWER_FONT_SIZE}px`,
          "--answer-row-gap": `${ANSWER_ROW_GAP}px`,
          "--answer-columns": answerColumns(numbered),
        } as CSSProperties
      }
      aria-label={`${title} 参考答案 第 ${pageIndex + 1} 页`}
    >
      <SheetHeader title={title} withMeta={false} />
      <div className="answer-grid">
        {problems.map((problem, index) => (
          <div className="answer-item" key={`${startIndex + index}`}>
            {numbered ? (
              <>
                <span className="problem-no">{startIndex + index + 1}.</span>
                <span>{shortAnswerOf(problem)}</span>
              </>
            ) : (
              <span>{fullAnswerOf(problem)}</span>
            )}
          </div>
        ))}
      </div>
      <footer className="page-number">
        参考答案 第 {pageIndex + 1} / {totalPages} 页 · 卷号 {seed}
      </footer>
    </article>
  );
}

export default App;
