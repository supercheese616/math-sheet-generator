# math-sheet 开发文档（供 AI 阅读）

- 子域名 / 访问地址：https://math-sheet.aithomas.cn
- 一句话用途：生成 A4 算术口算练习题、参考答案页，并支持打印 / 存为 PDF。
- 技术栈：react-ts（React + Vite + TypeScript）；轻量主屏应用（manifest / apple-touch-icon，无 service worker）；是否用 PocketBase：否。
- 原型：① 纯静态。
- 部署：SPA 是（`new-app.sh math-sheet` 默认 `try_files {path} /index.html`）；构建为 `npm run build`，产物在 `dist/`，无特殊步骤。

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
