# X Article Clipper 1.1.0 发布前风险检查

检查日期：2026-08-21

本检查覆盖当前本地发布候选源码和静态资产。它不等同于 Chrome Web Store 审核、法律意见或真实 X 页面兼容性验收。

## 已通过

- 产品身份：Manifest 显示名为 `X Article Clipper`，短名称为 `X Clipper`，版本为 `1.1.0`；技术项目名与仓库元数据为 `x-clipper` 和 `soyona/x-clipper`。
- 品牌资产：应用图标和页面入口使用用户确认的黑白“圆形书写轨迹 + 正在书写的铅笔”，不包含已知 X 官方 Logo path；`16/32/48/128px` PNG 与确定性 SVG 同步交付。
- 权限：仅保留运行时使用的 `storage`、`unlimitedStorage`、`sidePanel`、`scripting`；未使用的 `activeTab` 已移除。主机范围覆盖四个 X/Twitter HTTPS 页面入口及 `https://pbs.twimg.com/*`，后者只用于固化用户主动保存内容中的图片。
- 数据与隐私：无分析、广告、远程代码、开发者后端或 X API；隐私政策披露本地/会话存储、远程头像与封面原站加载、权限用途、删除方式和非官方关联声明。
- 契约一致性：产品名、技术命名空间、消息类型、DOM owner 标记、存储键、文件路径、文档与测试已同步迁移。
- 静态质量：JavaScript 语法、JSON 解析、SVG 渲染、PNG 尺寸与自动化契约测试均通过。

## 发布前仍需人工完成

- P0：在 Chrome 中以“加载已解压的扩展程序”加载本目录，确认 Manifest、四种图标尺寸、Side Panel、入口菜单、复制 Markdown、素材保存/删除和卸载清理行为。仓库规则禁止自动启动 Chrome，本次未执行。
- P0：使用当前 X Web 页面逐项验收 Article 与 Post 详情入口及快照边界，并确认所有 Post/Article 列表 Card 均不出现入口。X DOM 属于第三方可变依赖，静态测试不能证明兼容性。
- P1：在 Chrome Web Store Developer Dashboard 中使隐私披露、权限理由、商店说明和截图与 `PRIVACY.md` 保持一致。
- P1：由发布者确认 `X Article Clipper` 名称的商标/平台政策风险可接受。独立图标和非关联声明降低混淆风险，但不构成法律许可。
- P1：人工检查 `16px` 工具栏图标在浅色、深色及高 DPI 环境的可辨识度；自动尺寸检查不能替代视觉判断。
- P2：本地仓库已建立独立 Git 历史并配置 `https://github.com/soyona/x-clipper.git`；发布前仍需确认远端默认分支、LICENSE、支持渠道和发布标签状态，未经明确要求不提交、不推送。

## 发布门禁

只有所有 P0 项通过，且发布者明确接受或关闭 P1 项后，才应打包并提交 1.1.0。任何权限、主机范围、数据处理或品牌资产变化都必须重新运行本检查和完整测试。
