# X Article Clipper UI 图标规范

本规范保存用户确认的 UI 方案 1 与品牌方向 3，是项目内图标选择、实现和验收的单一权威规范。品牌实现以仓库中的确定性矢量源为权威，不从设计图反向描摹。

## 权威文件与优先级

1. 品牌源：`assets/icons/x-clipper-icon-source.svg`、`assets/icons/x-clipper-entry.svg`。
2. UI 图标库：`assets/icons/x-clipper-ui-icons.svg`；`symbol id` 是组件调用的稳定语义标识。
3. 视觉规范图：`docs/design/x-clipper-ui-icon-spec.svg`；`docs/design/x-clipper-ui-icon-spec.png` 是其人工查看版本。
4. 运行时内联 SVG 必须与图标库中同语义 `symbol` 保持相同的图形、viewBox、描边和填充规则。

后续新增或修改按钮、菜单、导航时，必须先从图标库按语义选用。若不存在对应语义，须先基于用户提供的 X SVG／组件证据补充图标库、映射表和契约测试，再进入业务界面；禁止临时内联自创 path、emoji 或 Unicode 图标。

## 品牌源

- 插件图标：`assets/icons/x-clipper-icon-source.svg`。
- X 页面与 Side Panel 单色入口：`assets/icons/x-clipper-entry.svg`。
- 品牌图形为用户确认的方向 3：圆形书写轨迹、正文短线与正在书写的铅笔；统一使用确定性 `24×24` 几何。
- 品牌仅使用纯黑与纯白。应用图标为黑底白形，X 页面与 Side Panel 入口通过 `currentColor` 适配宿主状态。
- 品牌图形不得包含、描摹或组合 X/Twitter 官方 Logo、官方商标 path 或近似字母标识。
- `16`、`32`、`48`、`128` PNG 只从正式 SVG 源生成。

## 导航状态

| 页面 | Default | Hover | Active | Focus visible |
|---|---|---|---|---|
| 待读 | `nav-reading-outline` | `nav-reading-filled` | `nav-reading-filled` | `nav-reading-outline` |
| 素材库 | `nav-library-outline` | `nav-library-filled` | `nav-library-filled` | `nav-library-outline` |
| 作者 | `nav-authors-outline` | `nav-authors-filled` | `nav-authors-filled` | `nav-authors-outline` |

- Default：`#536471` 线框。
- Hover：`#0f1419` 图标与 X 中性圆形 hover 背景。
- Active：`#1d9bf0` 填充图标，不显示持续边框或焦点环。
- Focus visible：只在键盘焦点时显示 `2px #1d9bf0` 焦点环；不得与 Active 合并。

## 语义图标

| 动作 | `symbol id` |
|---|---|
| 加入／移出待读 | `reading-add`／`reading-remove` |
| 保存／移出素材库 | `library-add`／`library-remove` |
| 预览 Article | `article-preview` |
| 复制 Markdown | `markdown-copy` |
| 收藏／取消收藏作者 | `author-add`／`author-remove` |
| 打开原文 | `open-original` |
| 编辑标签 | `edit-tags` |
| 标记已使用／未使用 | `mark-used`／`mark-unused` |
| 删除 | `delete`；只使用 destructive 颜色 |
| 搜索／更多／添加／关闭／复制 | `search`／`more`／`add`／`close`／`copy` |
| 蓝色／金色认证身份 | `verified-blue`／`verified-gold` |

菜单统一使用 `24×24` 图标槽、约 `1.9px` 圆角描边、`currentColor` 和 `12px` 图文间距。相反动作不得复用完全相同的图形。

认证徽标不是动作图标，运行时使用 X 的原始 `22×22` 几何：蓝色为 `#1d9bf0` 单色 path，金色保留 X 的双渐变与底部阴影 path。两类 SVG 均来自用户通过 X DevTools 提供的 `data-testid="icon-verified"` 证据；不得用布尔认证状态或自制简化 path 替代。

## 设计证据

- `x-clipper-logo-approved.png`：最终 Logo 比例和对齐证据。
- `x-clipper-ui-icon-spec.svg`：最终导航、菜单、动作和状态规范图。
- `x-clipper-ui-icon-spec.png`：由上述规范图和正式图标库生成的人工验收图，不再包含历史 Logo 方案。
