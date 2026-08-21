# Technical Context

## 定位

`x-clipper` 是独立的 Manifest V3 Chrome 扩展。它只处理用户主动选择的 X/Twitter Post 或 Article 详情内容，将完整文本和公开图片可靠保存在本地，用于稍后阅读与创作素材管理；不调用 X API，不上传内容，也不依赖其他本地项目。

## 运行模型

```text
X Post/Article 详情页
→ 当前 URL 对应的主内容入口
→ 加入待读或保存为素材
→ Content Script 采集当前主内容
→ Background 下载图片并提交 IndexedDB
→ Side Panel 管理待读、素材库、作者
→ Preview 按 itemId 重建本地阅读视图

作者页数据管理
→ 手动导出 JSON 备份
→ 手动选择备份文件
→ 在单个 IndexedDB 事务中合并缺失记录
```

Home、历史、作者 Posts/Articles 等列表 Card 不注入入口，也不从列表 DOM 创建快照。

## 模块与数据流

| 文件 | 责任 |
|---|---|
| `manifest.json` | `storage`、`unlimitedStorage`、`sidePanel`、`scripting` 权限；X/Twitter 页面及 `pbs.twimg.com` 主机范围；Service Worker、Side Panel 与声明式 Content Script |
| `content.js` | 已取证并冻结的页面识别、主内容所有权、入口几何和 Capture；详情页菜单、进行中状态、旧入口清理与 SPA 生命周期保护 |
| `post-snapshot.js` | 从当前主 Post 提取当前作者正文、属于当前 status ID 的图片和视频提示，排除引用内容 |
| `background.js` | `detail-only-v2` revision 校验；v1 迁移；图片 URL 去重、最多四路下载及 SHA-256 去重；统一内容与作者持久化；打开 Side Panel/本地阅读器 |
| `content-store.js` | schema v2 纯数据模型、URL/ID 规范化、状态更新、严格前缀 Post 补全和 v1 数据迁移 |
| `content-db.js` | IndexedDB `items`、`authors`、`images`、`meta` object store；原子写入、备份读取与非覆盖恢复 |
| `markdown.js` | Capture blocks 到 Markdown 的纯转换及 Article 重复标题清理 |
| `sidepanel.*` | 待读、素材库、作者三个一级页面；筛选、搜索、标签、使用状态与手动备份/恢复 |
| `preview.*` | 按 `itemId` 读取本地快照；Article 标题/正文渲染、Post 单正文渲染；兼容旧 session Preview |

## 持久化契约

- 主数据库为 `x-clipper-content`，schemaVersion 为 2；Post 与 Article 共用 `items`。
- 稳定内容 ID 为 `post_<statusId>` 或 `article_<articleId>`；同一规范化 URL 唯一。
- `readState: unread | read` 与 `materialState: none | unused | used` 独立；标签不因阅读状态变化而丢失。
- 图片以 Blob 保存在 `images`，内容记录只保存图片 ID；正文与成功图片在同一事务中提交。
- `chrome.storage.local` 的 `x-clipper-content-inbox` 只用于旧数据迁移和回退；`chrome.storage.session` 只保存一次性 Preview 与 Side Panel 导航目标。
- 备份格式为 `x-clipper-backup` version 1、schemaVersion 2，恢复只合并缺失 ID。

## 关键约束

- 只在 `/status/<id>` 或 `/article/<id>` 详情路由为当前 URL 对应的主 Post/Article 注入；所有列表 Card 不注入。
- 不猜测或扩展 X DOM。需要新 selector、SVG 或交互状态时，必须由用户通过 DevTools 提供最小证据。
- 不点击原生 More，不复用 X Dropdown 或 React 状态；扩展入口和菜单拥有独立 DOM 与生命周期。
- Post 只保存当前作者部分，不保存引用、回复、评论、线程、视频或音频文件。
- 不持久化 Cookie、令牌、剪贴板或未经用户主动保存的页面正文；不使用远程脚本、跟踪、代理或开发者后端。
- 不需要构建流程或第三方运行时依赖；验证使用 Node 内置 `node:test`，真实 Chrome/X 验收由用户人工执行。
