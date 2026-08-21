# X Article Clipper

X Article Clipper 是一个本地优先的 X 稍后阅读工具：在碎片时间保存有价值的 Post 或 Article 完整快照，之后集中精读或转为创作素材。

项目技术名称为 `x-clipper`。扩展不调用 X API、不上传内容，也不需要 API Key。正文和图片保存在浏览器扩展的本地 IndexedDB；视频和音频文件不保存。

源码仓库：[soyona/x-clipper](https://github.com/soyona/x-clipper)。当前项目已建立独立 Git 历史。

核心闭环是：`发现 Post/Article → 加入待读 → 本地精读 → 保存为素材 → 标记已使用`。阅读状态与素材状态独立，原文删除或修改不会覆盖首次快照。

## 安装

1. 在 Chrome 打开 `chrome://extensions` 并开启开发者模式。
2. 选择“加载已解压的扩展程序”，选中本项目目录。
3. 打开 Post 或 Article 详情页，在当前主内容的 X Clipper 菜单中选择“加入待读”；Home、历史和作者页等列表 Card 不提供入口。
4. 在 Side Panel 按未读/已读筛选并打开本地阅读器；需要复用时保存为素材。

“作者”页底部的数据管理区域可手动导出完整 JSON 备份，并在本机或另一浏览器配置中合并恢复正文、图片和状态。

扩展按钮不使用 Chrome 原生 Action Popup。Post 只保存当前作者当前 Post；引用 Post、回复、评论、线程以及视频/音频文件不在采集范围内。

## 开发

```bash
npm test
```

扩展不需要构建步骤或第三方依赖。`manifest.json` 是 Chrome 加载入口；`content.js` 负责页面采集，`markdown.js` 负责稳定的 Markdown 输出。

## 隐私

扩展仅在本地处理用户主动操作的 X 页面内容，不收集 Cookie、认证令牌或账号密码，不向开发者或第三方服务器传输内容。完整说明见 [PRIVACY.md](PRIVACY.md)。
