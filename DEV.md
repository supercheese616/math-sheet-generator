# math-sheet 开发文档（供 AI 阅读）

- 子域名 / 访问地址：https://math-sheet.aithomas.cn
- 一句话用途：生成 A4 算术口算练习题、参考答案页，并支持打印 / 存为 PDF。
- 技术栈：react-ts（React + Vite + TypeScript）；轻量主屏应用（manifest / apple-touch-icon，无 service worker）；是否用 PocketBase：否。
- 原型：① 纯静态。
- 部署：SPA 是（`new-app.sh math-sheet` 默认 `try_files {path} /index.html`）；构建为 `npm run build`，产物在 `dist/`，无特殊步骤。
- 打印：唯一打印按钮直接调用当前页面 `window.print()`；`@media print` 隐藏控制区，只输出当前预览的 A4 题目页 / 答案页，不再生成独立打印页面。

## PocketBase 集合（数据模型真源）

- 无。本应用不使用 PocketBase，不保存历史记录、错题或用户数据。

## 部署

- 服务器登记：`../.agents/skills/family-apps-deploy/scripts/new-app.sh math-sheet`
- 日常部署：`../.agents/skills/family-apps-deploy/scripts/deploy.sh math-sheet`
- 服务器目录：`/srv/apps/math-sheet/`
- Caddy 站点块应指向 `/srv/apps/math-sheet`，并包含 SPA 兜底。

## 特殊依赖 / 破例

- 无。服务器不安装 npm / Flutter / 原生模块，只接收 Mac 本地构建出的 `dist/`。

## 已知问题 / TODO

- 旧 Flutter Web / GitHub Pages 部署链路已移除；GitHub 只作为源码备份。
- ✅ 2026-07-03 排版溢出修正：每页固定 45 题，但字号/行距大时页面会超出 A4（打印溢出到额外纸张、页码不准）。现 (a) 预览用 `useLayoutEffect` 实测页高 >1123px 即显示告警条；(b) 默认行距 32→24px——实测 32px 行距下默认排版就已超高 8%（1212px），24px 恰好一页。已上线部署（deploy.sh math-sheet）。
- 部署状态：2026-06-29 首次上线（new-app.sh + deploy.sh 已执行）。
