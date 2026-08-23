# X Article Clipper 隐私政策

生效日期：2026 年 8 月 19 日

X Article Clipper 是独立浏览器扩展，与 X Corp. 没有关联，也未获得其认可或赞助。

## 插件处理的数据

只有用户在支持的 X 或 Twitter 页面主动执行 X Article Clipper 动作时，插件才会处理内容。根据用户选择的动作，插件可能在本地处理和保存：

- X Article 或 Post 的来源地址；
- 用户主动选择保存的公开可见 Article 或 Post 正文；
- 公开可见的标题、作者名称、handle、头像地址、认证展示、封面地址和发布时间；
- 从所选页面生成的 Markdown；
- 用户创建的标签、本地阅读状态和素材使用状态；
- 属于所选 Post 或 Article 的公开图片。

Post、Article 快照、作者和已下载图片保存在插件本地 IndexedDB。旧版 `chrome.storage.local` inbox 只在一次性迁移后作为回退来源保留。一次性 Markdown 预览和 Side Panel 导航目标保存在 `chrome.storage.session`。

用户选择“导出备份”时，插件会生成包含快照、作者、状态和图片的本地 JSON 文件，不会上传该文件。“恢复备份”只读取用户主动选择的文件，并将缺失记录合并到本地 IndexedDB。

## 插件不处理的数据

X Article Clipper 不收集或保存密码、认证令牌、Cookie、私信、支付信息、剪贴板历史或无关浏览历史。插件不使用 X API、分析统计、跟踪脚本、广告 SDK、远程代码、公共代理或开发者运营的后端。

## 数据传输与分享

插件不会把已保存内容或元数据发送给开发者或插件引入的第三方服务。处理与存储均通过 Chrome 扩展能力在用户设备上完成。用户保存内容时，插件只会从 X/Twitter 的 `pbs.twimg.com` 媒体主机直接下载属于该内容的公开图片并保存在本地。

插件不会出售、出租、分享用户数据，也不会将其用于广告、画像或信用决策。

## 权限用途

- `storage`：在本地保存迁移信息、界面语言和一次性预览状态。
- `unlimitedStorage`：让用户主动保存的正文与图片可以随本地内容库增长而可靠保留。
- `sidePanel`：提供待读、素材和作者主工作区。
- `scripting`：扩展更新或生命周期中断后，在当前受支持的 X 标签页恢复打包的扩展脚本。
- `x.com` 与 `twitter.com` 主机权限：识别支持的页面、显示用户主动使用的入口，并只读取所选动作需要的页面内容。
- `pbs.twimg.com` 主机权限：只下载用户明确保存内容中的图片。

## 用户控制与删除

用户决定插件处理哪些 Article、Post 或作者。内容可以在 Side Panel 中删除。卸载扩展会删除 Chrome 管理的本地与会话存储；用户也可以通过 Chrome 扩展管理工具清除插件数据。

## 政策变更

如果插件的数据处理方式发生变化，将在发布相关变更前同步更新本政策和 Chrome Web Store 隐私披露。

## 联系方式

隐私问题可以通过 [X Article Clipper Issue Tracker](https://github.com/soyona/x-clipper/issues) 提交。Issue 中请勿包含任何敏感或私密数据。
