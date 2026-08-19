# 仓库模块与存储契约

本文件是当前有效的模块、消息和存储边界。修改模块职责、消息协议、存储键、持久化或一次性预览时读取，并同步验证源码与测试。

## 模块职责

| 模块 | 当前职责 |
|---|---|
| `manifest.json` | Manifest V3、最小权限、X/Twitter 主机范围、Side Panel、Service Worker 与 Content Script 注册 |
| `background.js` | Content Script revision 校验与补注入；统一持久化待读、素材和作者；为当前 Article 写入按 ID 隔离的会话预览；打开并导航 Side Panel |
| `content.js` | X DOM 提取与 Capture；Grok 左侧独立入口；按页面和内容类型生成菜单；从当前权威 Article 原文采集 Markdown |
| `markdown.js` | Capture blocks 到 Markdown 的纯转换；保持无浏览器页面依赖，供 Node 测试直接执行 |
| `sidepanel.*` | 待读、素材库和作者三个一级页面；素材搜索、标签、预览、使用状态和删除 |
| `popup.*` | 旧 Popup 兼容路径；不作为主工作界面，除非兼容测试证明必要，否则不扩展其产品职责 |
| `preview.*` | 按 URL 模式加载可刷新的 Markdown 预览；当前 Article 可保存，已保存素材不重复保存 |
| `test/` | Markdown、Manifest、存储/消息协议、入口矩阵、菜单和 Side Panel 静态行为契约 |

## `chrome.storage.local` 持久数据

唯一产品数据键为 `x-clipper-content-inbox`。产品尚未上线，schema 不做历史迁移或兼容：

```js
{
  schemaVersion: 1,
  readingList: [],
  authors: [],
  assets: [],
}
```

- `readingList`：Article 展示元数据与 `addedAt`，不含 Markdown 和内容状态枚举；作者认证使用 `authorVerificationType: "" | "blue" | "gold"`。
- `authors`：handle、姓名、头像、`authorVerificationType`、简介和 `addedAt`。
- `assets`：Article 展示元数据、完整 `markdown`、`savedAt`、`tags` 和 `usageStatus`。不存在 `markdownState`、job 或半成品素材。
- 作者认证类型是展示元数据，不使用 `authorVerified` 布尔值；未知或无认证统一存为空字符串，不猜测 X 未取证的认证类型。
- Reading Article 与素材按规范化 Article URL 去重；URL 去除 query、hash 和 `/media/<id>` 子路由。
- 保存素材时覆盖更新展示元数据和 Markdown，保留用户已有标签和使用状态，并删除同 URL 待读项。移除素材不自动退回待读。
- 采集失败、来源 URL 不一致或 Markdown 为空时不得写入素材；Post 不进入任何持久集合。
- schemaVersion 不匹配时直接使用空 schema，不读取或迁移开发期 `candidates/subscriptions/assets`。
- 不持久化 Cookie、令牌、剪贴板内容或未经用户主动保存的页面正文。

## `chrome.storage.session` 会话数据

| Key | 用途 | 消费规则 |
|---|---|---|
| `x-clipper-markdown-preview:<previewId>` | 当前未保存 Article 的 Markdown 阅读页 | 浏览器会话内按唯一 `previewId` 保留，刷新可重复读取；预览页关闭按钮会删除当前 key |
| `x-clipper-sidepanel-target` | 打开 Side Panel 后的一次性目标视图 | 只允许 `readingList`、`assets`、`authors`，读取后立即删除 |

已保存素材的 Preview URL 使用 `assetId`，每次加载直接从 `chrome.storage.local` 的素材读取，因此刷新不复制或消费 Markdown。当前未保存 Article 的 Preview 使用唯一 session key，避免多个预览互相覆盖；临时预览不得迁移到 `chrome.storage.local`。不存在后台临时 X 标签、延迟 materialize 或 Preview 轮询状态。

## 消息边界

| 消息 | 所有者与结果 |
|---|---|
| `save-reading-article` | Background 校验 Article，按规范化 URL 加入或更新待读 |
| `remove-reading-article` | Background 按规范化 URL 从待读移除 |
| `save-article-asset` | 无 `assetId` 时校验当前 Article capture 与非空 Markdown 后保存；有 `assetId` 时只更新标签或 `usageStatus` |
| `remove-article-asset` | Background 按规范化 URL 删除素材，不写回待读 |
| `save-author` / `remove-author` | Background 按不区分大小写的 handle 收藏或取消收藏作者 |
| `open-markdown-preview` | 素材库传 `assetId` 并打开可重载的持久素材 Preview；当前 X Article 写入唯一 session preview 并打开可刷新的临时 Preview |
| `open-side-panel` | Background 打开 Side Panel，并把目标限制为三个一级页面 |

- Content Script revision 不匹配时，Background 只在用户点击扩展图标后对当前受支持 X Tab 补注入打包的 `markdown.js` 与 `content.js`。
- 变更任何消息名、payload、存储 key 或消费时序时，必须同步生产者、消费者、测试和本文档。

## 权限与数据安全

- 权限保持 Manifest 当前声明的 `storage`、`sidePanel`、`scripting` 和 X/Twitter HTTPS 主机范围；`activeTab` 未被运行时使用，已在 1.0.0 发布基线中移除。
- 不调用 X API、oEmbed、公共代理或自建上传服务，不添加远程脚本、跟踪分析或远程代码执行。
- 新增权限、扩大主机范围、改变持久化正文边界或新增外部数据路径，必须说明原因、补充测试并取得用户明确授权。
