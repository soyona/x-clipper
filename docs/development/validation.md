# 验证规范

`AGENTS.md` 的授权、安全与产品边界高于本文件。

## 默认验证

| 改动类型 | 必需验证 |
|---|---|
| README、规则、Memory Bank | `git diff --check` |
| `markdown.js`、`post-snapshot.js`、`content.js`、`content-store.js`、`content-db.js`、`background.js`、`manifest.json`、Side Panel 或 Preview | `npm test`、`git diff --check` |
| Chrome 实际页面兼容性 | Agent 不自动执行；缺少证据时由用户通过 Chrome DevTools 提供最小源码或属性片段 |

## 执行原则

- 仅在依赖缺失或 `package.json` 变化时运行 `npm install`。
- 优先运行与改动直接相关的测试；完成行为变更后运行一次完整 `npm test`。
- 若测试失败，记录具体用例和与本次改动的关系；代码未变化时不重复执行同一失败套件。
- 不将静态测试或 Manifest 校验表述为真实 X DOM、剪贴板权限或 Chrome Store 审核已通过。
- 禁止 Agent 自动启动 Chrome、浏览器自动化或真实 X 视觉验收；不得用猜测替代缺失的 DOM、SVG 或计算样式证据。
- 提交前确认 `git diff --check` 通过，并核对暂存范围不含无关改动。

## 当前关键回归契约

- 入口范围：Home、历史、作者 Posts/Articles 等列表 Card 均无入口；只允许当前 URL 对应的 Post 或 Article 详情主内容注入。
- 生命周期：`detail-only-v2` 必须拒绝并清理旧列表入口；SPA 离开详情后，已打开菜单不得继续采集。
- 快照完整性：重复加入默认不覆盖；只有已有 Post 纯文本是新正文的严格前缀时才允许补全，并保留标签、素材状态和生命周期时间。
- 本地阅读：Post 正文不得同时作为 Article 大标题和正文重复渲染；无 blocks 的兼容记录同样只渲染一次正文。
- 首次保存反馈：加入待读或保存素材时，菜单必须先渲染进行中文案并禁用重复动作，最终 Toast 仅在本地提交完成后出现。
- 图片持久化：同次采集按 URL 去重、最多四路并行下载、按内容哈希去重；正文与成功图片在同一 IndexedDB 事务中提交。
