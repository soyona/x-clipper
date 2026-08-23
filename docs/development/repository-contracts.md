# 仓库模块与存储契约

本文件是当前有效的模块、消息和存储边界。修改模块职责、消息协议、存储键、持久化或一次性预览时读取，并同步验证源码与测试。

## 模块职责

| 模块 | 当前职责 |
|---|---|
| `manifest.json` | Manifest V3、最小权限、X/Twitter 主机范围、Side Panel、Service Worker 与 Content Script 注册 |
| `background.js` | Content Script revision 校验与补注入；迁移旧数据；对图片做 URL 去重和有界并行固化；持久化统一内容、阅读/素材状态和作者 |
| `content.js` | 已冻结的 X DOM 提取与 Capture；只在 Post/Article 详情主内容的 Grok/Summarize 左侧提供独立入口；管理菜单进行中状态与 SPA 生命周期保护 |
| `post-snapshot.js` | 基于用户提供 DOM 证据，只提取当前作者当前 Post 的正文、所属图片和视频提示 |
| `content-store.js` | schema v2 纯数据模型、URL/ID 规范化、生命周期更新与 v1 迁移 |
| `content-db.js` | IndexedDB 事务、内容/作者/图片/meta 四个 object store |
| `markdown.js` | Capture blocks 到 Markdown 的纯转换；保持无浏览器页面依赖，供 Node 测试直接执行 |
| `sidepanel.*` | 待读、素材库和作者三个一级页面；本地快照列表、阅读筛选、素材搜索、标签与使用状态 |
| `popup.*` | 旧 Popup 兼容路径；不作为主工作界面，除非兼容测试证明必要，否则不扩展其产品职责 |
| `preview.*` | 从 IndexedDB 加载完整本地快照并渲染正文/图片；Article 保留标题层级，Post 只渲染一次正文；兼容旧版一次性 Markdown Preview |
| `test/` | Markdown、Manifest、存储/消息协议、入口矩阵、菜单和 Side Panel 静态行为契约 |

## IndexedDB 持久数据

主数据库为 `x-clipper-content`，包含 `items`、`authors`、`images`、`meta`。`ContentItem` schemaVersion 为 2，Post 与 Article 共用 `items`：正文 blocks/Markdown、图片 ID、快照完整性、`readState`、`materialState`、标签和时间字段。

- 同一规范化 URL 只有一个稳定 ID：`post_<statusId>` 或 `article_<articleId>`。
- 首次快照不可被普通重复加入覆盖；重复加入只恢复 `readState: unread`。Post 的已有纯文本仅在它是新采集纯文本的严格前缀时允许补全，正文与图片在同一 IndexedDB 事务中提交，并保留素材状态、标签及原有生命周期时间；非前缀变化不得覆盖。
- `readState: unread | read` 与 `materialState: none | unused | used` 独立更新。`readingAddedAt` 只记录首次进入统一内容集合或从 X 页面重新加入待读的时间；Side Panel 内标记未读不得刷新它。`materialAddedAt` 只在素材状态从 `none` 进入 `unused | used` 时刷新；标签、使用状态和阅读操作不得污染两个加入时间。
- Side Panel 的“加入时间”排序在待读使用 `readingAddedAt`，在素材库使用 `materialAddedAt`，旧数据依次回退到 `capturedAt`、`createdAt`；“发布时间”使用 `publishedAt`，缺失或无效值排在末尾。两种排序均为倒序。
- 图片从 `pbs.twimg.com` 下载为 Blob：同次采集先按源 URL 去重，最多四路并行下载，再以 SHA-256 内容 ID 去重并与内容在同一 IndexedDB 事务中提交。图片失败时文本仍保存，`snapshotState` 为 `incomplete`。
- 作者按小写 handle 去重；认证类型仅允许空、blue、gold。
- `chrome.storage.local` 的 `x-clipper-content-inbox` 仅作为 v1 迁移和回退来源。迁移 marker 为 `legacy-v1-imported`；旧键不删除、不覆盖，迁移幂等。
- 手动备份格式为 `format: "x-clipper-backup"`、`version: 1`、`schemaVersion: 2` 的 JSON，包含内容、作者和 base64 图片。恢复只合并缺失 ID，不覆盖当前记录，并在单个 IndexedDB 事务中写入。
- 不持久化 Cookie、令牌、剪贴板内容或未经用户主动保存的页面正文。

## `chrome.storage.session` 会话数据

| Key | 用途 | 消费规则 |
|---|---|---|
| `x-clipper-markdown-preview:<previewId>` | 当前未保存 Article 的 Markdown 阅读页 | 浏览器会话内按唯一 `previewId` 保留，刷新可重复读取；预览页关闭按钮会删除当前 key |
| `x-clipper-sidepanel-target` | 打开 Side Panel 后的一次性目标视图 | 只允许 `readingList`、`assets`、`authors`，读取后立即删除 |

`chrome.storage.local` 的 `x-clipper-locale` 仅保存用户界面语言，允许 `en`、`zh-CN`；它不改变内容 schema、正文或备份格式。

本地阅读器 URL 使用 `itemId`，每次从 IndexedDB 重建正文和图片。Article 使用独立标题与正文，Post 不把正文提升为 Article 标题，也不重复渲染。旧版当前 Article Preview 继续使用唯一 session key，避免刷新或多个预览互相覆盖。

## 消息边界

| 消息 | 所有者与结果 |
|---|---|
| `read-content-state` | 迁移后读取 schema v2 内容和作者 |
| `save-content-item` | 固化用户主动采集的文本与图片；`target: reading | material` 区分加入待读和直接保存素材，避免素材动作误刷新待读加入时间；重复项仅可按严格前缀规则补全截断的 Post 快照 |
| `capture-article-reference` | 保留的兼容协议：可打开一次不激活临时页采集 Article；当前详情页限定 UI 不发送该消息 |
| `update-content-item` / `remove-content-item` | 更新阅读、素材、标签状态或删除内容 |
| `save-content-author` / `remove-content-author` | 按不区分大小写的 handle 收藏或取消收藏作者 |
| `open-content-reader` | 以 `itemId` 打开 IndexedDB 本地阅读器 |
| `open-side-panel` | Background 打开 Side Panel，并把目标限制为三个一级页面 |

- 当前 Content Script revision 为 `detail-only-v3`。revision 不匹配时，Background 只在用户点击扩展图标后补注入打包的 `i18n.js`、`markdown.js`、`post-snapshot.js` 与 `content.js`；新实例必须释放旧实例和残留入口。
- 变更任何消息名、payload、存储 key 或消费时序时，必须同步生产者、消费者、测试和本文档。

## 权限与数据安全

- 权限为 `storage`、`unlimitedStorage`、`sidePanel`、`scripting`，主机范围为 X/Twitter HTTPS 页面及 `https://pbs.twimg.com/*`。后者只用于下载用户明确保存内容中的图片；`activeTab` 不使用。
- 不调用 X API、oEmbed、公共代理或自建上传服务，不添加远程脚本、跟踪分析或远程代码执行。
- 新增权限、扩大主机范围、改变持久化正文边界或新增外部数据路径，必须说明原因、补充测试并取得用户明确授权。
