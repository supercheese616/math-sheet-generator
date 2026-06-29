# 算术题打印生成器

Family Apps 中的纯静态小应用，用于快速生成 A4 口算练习题和参考答案页。

## 功能

- 6 类题型：20 以内加法、20 以内加减混合、100 以内不退位减法、100 以内加减混合、9x9 乘法、表内整除。
- 页数和题数联动，每页固定 45 题，最多 990 题。
- 可调整字号、行间距、是否显示填空横线、是否附带参考答案页。
- 生成独立打印页，可直接打印或存为 PDF。

## 开发

```bash
npm install
npm run dev
npm run test
npm run build
```

部署到 Family Apps 时使用工作区脚本：

```bash
../.agents/skills/family-apps-deploy/scripts/deploy.sh math-sheet
```
