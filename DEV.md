# math-sheet 开发文档（供 AI 阅读）

- 子域名 / 访问地址：https://math-sheet.aithomas.cn
- 一句话用途：按年级选题型、混合组卷，生成 A4 口算练习 + 参考答案页，打印/存 PDF，卷号可复现。
- 技术栈：react-ts（React + Vite + TypeScript）；轻量主屏应用（manifest / apple-touch-icon，无 service worker）；是否用 PocketBase：否。
- 原型：① 纯静态。
- 部署：SPA 是（`new-app.sh math-sheet` 默认 `try_files {path} /index.html`）；构建为 `npm run build`，产物在 `dist/`，无特殊步骤。
- 打印：唯一打印按钮直接调用 `window.print()`；`@media print` 隐藏控制区，只输出 A4 题目页/答案页。

## 架构（2026-07 v0.3 完整重写后）

| 文件 | 职责 |
|---|---|
| `src/types.ts` | Problem 三态（eq/rem/cmp）、Preset、SheetSettings 等类型 |
| `src/rng.ts` | 种子随机（xmur3+mulberry32）：同一卷号+同一设置 = 同一份卷子；卷号字符集去掉 0/O/1/I/L |
| `src/engine.ts` | 17 个题型 preset（构造式生成，含进位/退位/整除/余数约束）、出题形式变换（求未知数/比大小）、组卷（均分+洗牌+同卷去重，40 次尝试后允许重复） |
| `src/layout.ts` | **自动排版数学**：由字号/行距算每页行数（永不纵向溢出），maxColumnsFor 按题面宽度+字号限列数（防横向溢出）；答案页容量 |
| `src/App.tsx` | 全部 UI；设置持久化 localStorage `math-sheet:v2`；URL `?s=卷号` |
| `src/styles.css` | 「作业本」纸感设计系统 + 打印样式 |

### ⚠️ 排版常量联动（改动最容易踩的坑）

`layout.ts` 的 `TITLE_BLOCK=100`、`LINE_HEIGHT=1.15`、`ANSWER_*` 与 `styles.css` 里
`.sheet-title`（26px 标题 + 14px meta + 10px padding + 2px border + 24px gap ≈ 90）、
`.problem-item { line-height: 1.15 }`、`.answer-grid { line-height: 1.3 }` **必须两边同步改**。
预览里还有 `useLayoutEffect` 实测兜底告警（正常永不触发）。

- 预览页 794×1123px @96dpi，padding 56px；打印 `@page margin 0` + `.sheet-preview padding 15mm`
  （15mm≈56.7px > 56px，所以"预览放得下 ⇒ 打印一定放得下"）。
- 界面字体 Fraunces（`@fontsource-variable/fraunces` 本地打包，无外网 CDN 依赖）；
  纸面保持 Times New Roman / SimSun。

## PocketBase 集合（数据模型真源）

- 无。本应用不使用 PocketBase，不保存历史记录、错题或用户数据。

## 部署

- 服务器登记：已登记（2026-06-29 首次上线）。
- 日常部署：应用目录内执行 `../.agents/skills/family-apps-deploy/scripts/deploy.sh`（读 `.deployrc` 的 `APP=math-sheet`）。
- 服务器目录：`/srv/apps/math-sheet/`。

## 特殊依赖 / 破例

- 无。服务器只接收 Mac 本地构建出的 `dist/`。

## 已知问题 / TODO

- 图标（favicon/PNG）还是旧的 teal 配色，与 v0.3 新品牌（奶油纸+朱砂红）不一致，可择机重做。
- 历史：2026-06-29 首次上线；2026-07-03 溢出预警+默认行距修正（已被 v0.3 自动排版取代）；
  **2026-07-07 v0.3 完整重写**（题型体系/出题形式/自动排版/卷号复现/答案页紧凑化/UI 全新设计
  + 书写框/圆圈 CSS 化 + 0 类题降频 + 字号调大至 24/30/36、中+标准=45题/页、行距伸展填版心），
  28 个 vitest 用例 + tsc 全绿，浏览器实测通过。
  **v0.3 已于 2026-07-07 用 deploy.sh 部署上线并通过部署后验证**（curl 200 + index.html 哈希一致）。
