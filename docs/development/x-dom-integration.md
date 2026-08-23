# X DOM 集成契约

本文件记录 x-clipper 与 X Web 集成时已经验证的页面事实和实现边界。只有修改 X DOM、Card、Grok 左侧入口或独立菜单时读取。

## 已验证锚点

- 入口锚点：`button[aria-label="Grok actions"]`
- Post/Card 根节点：`article[data-testid="tweet"]`
- 虚拟列表上下文：`[data-testid="cellInnerDiv"]`
- 局部观察根节点：`main`
- 原生 More：`button[data-testid="caret"][aria-haspopup="menu"]`，只属于 X，不作为扩展菜单触发器
- 当前 `/home`、`/i/history` 与 `/i/history/likes` Card 已验证顶层结构为 `x-clipper slot | Grok slot（可选） | More wrapper`。More wrapper 是入口的权威锚点：x-clipper slot 与 More wrapper 必须共享同一个直接父节点；存在同级 Grok slot 时插在 Grok 左侧，否则直接插在 More 左侧。More 仅用于定位，不点击、不复用其状态或生命周期。
- Article `/status` 已验证同一 Grok 图标按钮可能使用 `aria-label="Summarize"`。`Grok actions` 与 `Summarize` 都属于 utility action 锚点；入口必须插在该按钮左侧，不能因标签变化回退到 More 左侧而改变顺序。
- 入口只复用同级 Grok slot（存在时）或 More button slot（无 Grok 时）的空外壳几何；按钮与 SVG 必须创建在扩展拥有的 Shadow DOM 内。不得克隆 X 按钮/SVG 子树，不得对 X 已连接 SVG 写 path 或调用 `replaceChildren()`，避免 React reconciliation 把扩展图形复用到 Verified 等原生节点。
- 已验证的 `/home`、`/i/history`、`/i/history/likes`、作者 Posts 和作者 Articles 五个列表场景只以各自 Card 内的 `article[data-testid="tweet"]` 作为所有权边界；这些事实不得外推为未经取证的“所有列表页面”通用规则。在这五个场景中，`cellInnerDiv` 仅是虚拟列表定位容器，不是入口 owner。More 必须满足 `moreButton.closest('article[data-testid="tweet"]') === card`。入口 host 必须用新 DIV 创建，不克隆 X 节点；若 host 不再与该 Card 的 More wrapper 共享同一动作行，或被移动到虚拟列表容器，立即删除。
- `/用户名/status/<id>` 详情页只允许当前 URL status ID 对应的主 Post Card 成为入口 owner。主 Card 必须包含指向该 status ID 的站内链接；回复、引用 Post 与其他 `cellInnerDiv` 不参与详情页入口注入。
- Article 详情页的作者元数据属于当前主 `article[data-testid="tweet"]`，与正文采集容器分属不同层级。作者栏已验证使用 `data-testid="Tweet-User-Avatar"`、`data-testid="User-Name"` 和 `svg[data-testid="icon-verified"]`；发布时间使用主 Card 内的 `time[datetime]`。蓝色认证 SVG 是 `#1d9bf0` 单色 path，金色组织认证 SVG 含两个 `linearGradient` 和三个填充 path；采集时据此记录 `blue`／`gold`，不存在徽标则记录空字符串。采集头像、name、徽标与发布时间时必须限定在该主 Card，正文仍使用 Article 正文容器；不得以正文容器缺少作者栏为由回退到全局 document，也不得读取回复或推荐 Card。

## 已验证的 Post 快照所有权

以下事实来自用户通过 Chrome DevTools 提供的单 Card `outerHTML`，只用于新增的隔离 Post 快照投影；不得据此修改既有 Article/Post 候选、入口 owner、挂载、展开或 `capturePage()` 解析。

- 包含引用内容的普通 Post 在同一个主 `article[data-testid="tweet"]` 内同时存在两个 `data-testid="tweetText"`。当前作者正文不位于 `role="link"` 祖先内；引用 Post 的 `tweetText` 位于独立的嵌套 `role="link"` 容器内。Post 快照只选择不属于该嵌套引用容器的当前作者正文。
- 长 Post 展开前存在 `data-testid="tweet-text-show-more-link"`、`role="button"` 和 `Show more` 文案；展开后该控件消失，目标 `tweetText` 从截断文本替换为完整正文。现有 `expandCollapsedContent()` 已覆盖该结构，保持冻结并直接复用。
- 多图 Post 的正文图片位于 `data-testid="tweetPhoto"`，每张图片的所属链接为 `/作者/status/<当前 status ID>/photo/<序号>`。同 Card 中引用 Post 的图片使用另一个 status ID，头像位于 `data-testid="Tweet-User-Avatar"` 且不属于 `tweetPhoto`。Post 快照只接受图片所属 status ID 与目标 Post ID 完全一致的图片。
- 未播放视频没有 `<video>` 节点。已验证的视频证据位于 `data-testid="tweetPhoto"` 内，使用 `data-testid="previewInterstitial"`、`aria-label="Embedded video"`、`data-testid="playButton"` 和 `aria-label="Play this video"`；封面来自 `pbs.twimg.com/amplify_video_thumb/`。快照只记录 `mediaNotice: "video"`，不保存视频或视频封面。
- 当前没有音频 Post 源码证据。首批实现不得新增音频或 Space selector，不得猜测音频 DOM；未知的非图片媒体保持未识别且不下载。

上述新增规则的实现所有者为独立 `post-snapshot.js`。`content.js` 中已经取证的页面识别、候选解析、入口所有权、入口几何、目标展开和通用 Capture 逻辑由 `test/x-dom-freeze.test.js` 机械冻结。

入口的直接视觉结构按同一动作行中的兄弟槽位理解：

```text
x-clipper slot | Grok slot（可选） | More wrapper
```

## 已验证场景的统一内容入口矩阵

本矩阵只使用用户此前提供的 DOM 证据，不把已验证事实扩展到新页面。列表页中的 `cellInnerDiv` 只负责虚拟列表定位；入口始终归属于内部 Card。Post 与 Article 可能共享 `/用户名/status/<id>` 路由，必须根据当前主 Card 的内容结构区分，不能只依据 URL 猜测类型。

| 场景 | 页面与内容 | 唯一入口 owner | utility action 锚点 | 插入位置 | 必须排除 |
|---|---|---|---|---|---|
| 1 | `/home`、`/i/history`、`/i/history/likes` 中的所有列表 Card | 不注入 | — | — | 全部 Post 与 Article Card |
| 2 | `/用户名/status/<id>` 普通 Post 详情页 | 包含当前 URL status ID 站内链接的主 Post `article[data-testid="tweet"]` | `Grok actions`；不存在时以主 Card 的 More wrapper 定位 | utility action 左侧；无 utility action 时在 More 左侧 | 回复、引用 Post、推荐 Card、其他 status ID |
| 3 | `/用户名/status/<id>` Article 详情页 | 包含当前 URL status ID 站内链接的主 Article Card | `Summarize` 或 `Grok actions` | 固定为 `x-clipper | Summarize/Grok | More` | 回复、引用内容、相关 Article、仅凭 URL 推断 Article 类型 |
| 4 | `/用户名` 作者主页 Posts Tab 中的所有列表 Card | 不注入 | — | — | 全部 Post 与 Article Card |
| 5 | `/用户名/articles` 作者主页 Articles 列表 Card | 不注入 | — | — | 全部 Article Card |

作者 Articles 场景的 Card 结构证据继续保留，但产品入口范围已收紧为只支持详情页；所有列表 Card 均不再注入入口。Card 内的 `data-testid="article-cover-image"` 只用于内容识别，不作为入口挂载锚点。

### 变更授权边界

- 上述场景的 DOM owner、锚点和挂载生命周期均基于用户提供的真实 X DOM 源码，不是猜测或通用实现。统一内容产品边界只改变已取证 Card 是否注入和菜单动作，不授权猜测新的 X 结构。
- 未经用户明确授权，不得修改本矩阵中的路由范围、owner、锚点、插入顺序或对应 DOM 实现；“结构相似”“减少重复”“通用化”均不构成授权。
- 新页面或新 DOM 变体不得自动并入现有场景；必须先取得支持该决策的最小 DOM 证据，再由用户明确授权修改。
- 只读诊断可以确认现状，但不构成修改代码、测试、规则或本文档的授权。
- 用户只授权整理文档时，不得同步修改代码、测试、版本号、Manifest、存储或消息协议。

## 所有权边界

| 对象 | 所有者 | 允许的复用 |
|---|---|---|
| Grok/Summarize 按钮和状态 | X | 只读取同级 slot class、计算后几何与颜色；不得克隆已连接按钮或 SVG 子树 |
| More 按钮和 Dropdown | X | 不复用点击、Portal、菜单挂载或重绘生命周期 |
| x-clipper 按钮 | 扩展 | 自主管理 hover、focus、expanded 和 click |
| x-clipper 菜单 | 扩展 | 自主创建、定位、关闭和读取动态状态 |

## 禁止架构

- 不执行原生 `caret.click()` 来打开扩展菜单。
- 不等待或改写 X 的 `[data-testid="Dropdown"]`。
- 不通过隐藏原生菜单项制造“独立菜单”。
- 不通过 `pointerover`、`mousemove`、hover 或滚动启动核心入口注入。
- 不以整个 `document` 作为默认观察范围。
- 不从同一详情页中的相关内容链接推断当前 Post/Article 身份。

## 注入生命周期

1. Content Script 初始化并发布可读取的 revision/阶段诊断。
2. 若 `main` 尚未挂载，以可取消的短周期任务等待。
3. `main` 可用后只在详情路由为当前 URL 对应的主 Post 或 Article 生成候选；列表 Card 即使被局部观察器发现也必须返回空候选，不得注入入口。
4. 只观察 `main` 中新增节点所属的局部 Card，用于 SPA 详情切换、主 Card 出现和无效入口清理；不得把 `cellInnerDiv` 当作注入根，也不得把已验证结论扩展到新页面。
5. 以 `data-x-clipper-article-actions-slot` 标记扩展拥有的完整槽位，并在释放时连同入口整体删除；旧入口兼容清理也必须删除父槽位。
   - 只有仍与 More wrapper 共享已验证动作行、且 Shadow DOM 中仍含扩展入口的 slot 才可整体删除。
   - 若 slot 已被 X React 移动或复用，禁止删除宿主节点；只清空扩展 Shadow DOM、移除扩展标记和扩展添加的 `margin-left`，避免删除 X 的 Stream 或页面根布局。
6. 点击入口后，从所属 Card 或详情主 Card 生成内容上下文并直接创建扩展菜单。
   - 普通 Post 列表不注入入口；Post 详情提供“加入待读/从待读移除”和“复制 Markdown”，快照只读取当前作者当前 Post。
   - Article 列表不注入入口；用户进入详情页后操作。
   - Article 详情提供待读、素材、预览/复制与作者动作。保存与预览只采集当前 URL 对应的权威主 Article。
   - Capture 只允许展开目标 root 内的折叠内容；不得以整个文档高度为条件调用 `window.scrollTo()` 加载 Timeline、回复或推荐内容。
   - Article 标题以原文页的 `twitter-article-title`（及兼容标题 testid）为权威来源；采集块中与其完全相同的一级标题只保留一次。`Click to Follow/Subscribe` 属于 X 控件文案，不进入正文。
7. 非详情路由上的残留入口点击必须被拒绝并立即清理；菜单打开后若 SPA 已离开原详情、主 Card 已断开或当前候选 URL 已变化，动作必须静默终止并关闭菜单，不得继续调用 Capture 或记录页面加载错误。
8. 当前 revision 为 `detail-only-v3`；Background 发现旧 revision 时补注入当前打包脚本（先加载 `i18n.js`），新实例负责释放旧监听器并清理旧列表入口。
9. 新打开或刷新的 X 页面只通过 Manifest `content_scripts` 声明式注入；Service Worker 启动、扩展安装和浏览器启动时不得扫描全部 X Tab 并主动执行脚本。只有用户点击扩展图标时，后台才可对当前 Tab 做显式补救注入。
10. 再次点击、点击外部、`Escape`、滚动或窗口缩放时关闭菜单。
11. Content Script dispose 时释放定时器、观察器、样式、菜单和入口节点。

## UI 分层诊断

遇到视觉问题时按层级定位，不用同一组 CSS 同时猜测多个原因：

| 现象 | 首先检查 |
|---|---|
| 图形轮廓不正确 | SVG path 与 `viewBox` |
| 图标大小不一致 | SVG class、width、height |
| 与 Grok/More 不对齐 | slot、按钮内部结构、flex 与 line box |
| hover 无反馈 | 按钮自身 hover/focus/expanded 状态 |
| Card 内容发生位移 | 注入节点几何和动作行父容器布局 |
| 图标延迟出现 | Content Script revision、`main` 等待和局部观察阶段 |

## 最小 DOM 取证

页面结构不确定时，只返回支持当前决策的小型 JSON。至少包括：目标数量、直接父节点、最近 Card 和关键祖先属性。禁止先返回整页 DOM 再裁剪。

当前诊断入口：

```js
({
  revision: document.documentElement.dataset.xClipperContentScriptRevision,
  stage: document.documentElement.dataset.xClipperArticleActionsStage,
  grok: document.querySelectorAll('button[aria-label="Grok actions"]').length,
  xClipper: document.querySelectorAll('[data-x-clipper-article-actions-entry]').length,
})
```

## 行为验收矩阵

至少覆盖：Home、历史、作者 Posts/Articles 中所有列表 Card 无入口，Post `/status` 的待读与复制菜单，以及 Article `/status` 或 `/article` 菜单；验证入口范围、位置、hover/focus、菜单无 More 闪现、动态文案、当前详情上下文、重复注入、关闭方式和 Content Script 重载。

禁止自动启动 Chrome 或浏览器自动化。若现有证据不足以确认 X DOM、SVG 或计算样式，必须要求用户通过 Chrome DevTools 提供支持当前决策的最小源码或属性片段，禁止猜测。

静态测试必须明确阻止原生 More 依赖；真实 X 页面兼容性、剪贴板权限、视觉对齐和扩展加载行为保持未验证，只能由用户人工验收并提供结果。
