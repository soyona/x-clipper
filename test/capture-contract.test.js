import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function markdownTools() {
  const context = { globalThis: {} };
  runInNewContext(source("../markdown.js"), context);
  return context.globalThis.XClipperMarkdown;
}

function backgroundContext() {
  const event = { addListener() {} };
  const context = {
    URL,
    globalThis: null,
    chrome: {
      runtime: { onMessage: event, getURL: (value) => value, sendMessage: async () => ({}) },
      action: { onClicked: event },
      tabs: { sendMessage: async () => ({}), get: async (id) => ({ id }), create: async () => ({}) },
      scripting: { executeScript: async () => {} },
      storage: { local: { get: async () => ({}), set: async () => {} }, session: { get: async () => ({}), set: async () => {}, remove: async () => {} } },
      sidePanel: { open: async () => {} },
    },
    console: { error() {} },
  };
  context.globalThis = context;
  runInNewContext(source("../background.js"), context);
  return context;
}

function contentVerificationClassifier() {
  const content = source("../content.js");
  const start = content.indexOf("function authorVerificationTypeFromRoot");
  const end = content.indexOf("\n\nfunction authorPresentationFromElement", start);
  const context = { globalThis: {} };
  runInNewContext(`${content.slice(start, end)}\nglobalThis.classify = authorVerificationTypeFromRoot;`, context);
  return context.globalThis.classify;
}

function sidepanelBadgeRenderer() {
  const panel = source("../sidepanel.js");
  const start = panel.indexOf("let verifiedBadgeSequence");
  const end = panel.indexOf("\n\nfunction moreIcon", start);
  const context = { globalThis: {} };
  runInNewContext(`${panel.slice(start, end)}\nglobalThis.renderBadge = verifiedBadge;`, context);
  return context.globalThis.renderBadge;
}

function article(overrides = {}) {
  return {
    contentType: "article",
    sourceUrl: "https://x.com/example/article/42?ref=share",
    title: "Article title",
    authorHandle: "example",
    authorName: "Example",
    authorVerificationType: "blue",
    ...overrides,
  };
}

test("Markdown 保留文本结构且过滤图片", () => {
  const markdown = markdownTools().blocksToMarkdown([
    { type: "heading", level: 1, text: "文章标题" },
    { type: "paragraph", text: "正文内容" },
    { type: "image", url: "https://pbs.twimg.com/media/example" },
    { type: "code", text: "const answer = 42;", language: "js" },
  ], { includeImages: false });
  assert.match(markdown, /^# 文章标题\n\n正文内容/u);
  assert.match(markdown, /```js\nconst answer = 42;/u);
  assert.doesNotMatch(markdown, /pbs\.twimg\.com/u);
});

test("Article 采集只保留一个与文档标题相同的一级标题", () => {
  const title = "Obsidian 别只装完就吃灰";
  const blocks = markdownTools().withoutRepeatedDocumentTitle([
    { type: "heading", level: 1, text: title },
    { type: "paragraph", text: "正文第一段" },
    { type: "heading", level: 1, text: `  ${title}\n` },
    { type: "heading", level: 2, text: title },
  ], title);
  assert.deepEqual(blocks.map((block) => [block.type, block.level, block.text]), [
    ["heading", 1, title],
    ["paragraph", undefined, "正文第一段"],
    ["heading", 2, title],
  ]);
});

test("Manifest 保持独立运行所需的最小权限", () => {
  const manifest = JSON.parse(source("../manifest.json"));
  assert.equal(manifest.name, "X Article Clipper");
  assert.equal(manifest.short_name, "X Clipper");
  assert.equal(manifest.version, "1.1.2");
  assert.equal(manifest.description, "Save valuable X Posts and Articles locally for focused reading and creative work.");
  assert.deepEqual(manifest.permissions, ["storage", "unlimitedStorage", "sidePanel", "scripting"]);
  assert.equal(manifest.permissions.includes("activeTab"), false);
  assert.deepEqual(manifest.host_permissions, [
    "https://x.com/*", "https://www.x.com/*", "https://twitter.com/*", "https://www.twitter.com/*", "https://pbs.twimg.com/*",
  ]);
  assert.deepEqual(manifest.side_panel, { default_path: "sidepanel.html" });
  assert.equal(manifest.action.default_popup, undefined);
  assert.equal(manifest.action.default_title, "Open X Article Clipper");
  assert.equal(manifest.background.service_worker, "background.js");
  assert.deepEqual(manifest.content_scripts[0].js, ["i18n.js", "markdown.js", "post-snapshot.js", "content.js"]);
});

test("1.1.2 发布元数据包含仓库和隐私披露", () => {
  const packageMetadata = JSON.parse(source("../package.json"));
  const privacy = source("../PRIVACY.md");
  assert.equal(packageMetadata.name, "x-clipper");
  assert.equal(packageMetadata.version, "1.1.2");
  assert.equal(packageMetadata.repository.url, "https://github.com/soyona/x-clipper.git");
  assert.match(privacy, /not affiliated with, endorsed by, or sponsored by X Corp/u);
  assert.match(privacy, /pbs\.twimg\.com[\s\S]*stores them locally/u);
  assert.match(privacy, /storage[\s\S]*sidePanel[\s\S]*scripting/u);
});

test("新 schema 不迁移开发期数据", () => {
  const store = backgroundContext().XClipperInboxStore;
  assert.deepEqual(JSON.parse(JSON.stringify(store.emptyInbox())), {
    schemaVersion: 1, readingList: [], authors: [], assets: [],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(store.currentInbox({ candidates: [{}], subscriptions: [{}], assets: [{}] }))), {
    schemaVersion: 1, readingList: [], authors: [], assets: [],
  });
});

test("待读只接受 Article 并按规范化 URL 去重", () => {
  const store = backgroundContext().XClipperInboxStore;
  const first = store.saveReadingArticle(store.emptyInbox(), article(), { id: "reading_1", now: "2026-08-14T00:00:00Z" });
  const second = store.saveReadingArticle(first.inbox, article({ title: "Updated" }), { id: "reading_2", now: "2026-08-14T01:00:00Z" });
  assert.equal(second.inbox.readingList.length, 1);
  assert.equal(second.inbox.readingList[0].id, "reading_1");
  assert.equal(second.inbox.readingList[0].title, "Updated");
  assert.equal(second.inbox.readingList[0].sourceUrl, "https://x.com/example/article/42");
  assert.equal(second.inbox.readingList[0].addedAt, "2026-08-14T00:00:00Z");
  assert.equal(second.inbox.readingList[0].authorVerificationType, "blue");
  assert.equal("markdown" in second.inbox.readingList[0], false);
  assert.throws(() => store.saveReadingArticle(second.inbox, article({ contentType: "post" })), /Article/u);
  assert.throws(() => store.saveReadingArticle(second.inbox, article({ sourceUrl: "https://example.com/article/42" })), /Article/u);
});

test("素材只在 Article Markdown 有效时保存并同步移出待读", () => {
  const store = backgroundContext().XClipperInboxStore;
  const queued = store.saveReadingArticle(store.emptyInbox(), article(), { id: "reading_1", now: "2026-08-14T00:00:00Z" }).inbox;
  assert.throws(() => store.saveArticleAsset(queued, article({ content: "" })), /Markdown/u);
  assert.equal(queued.assets.length, 0);
  assert.equal(queued.readingList.length, 1);

  const saved = store.saveArticleAsset(queued, article({ content: "# Article title\n\nBody" }), { id: "asset_1", now: "2026-08-14T01:00:00Z" });
  assert.equal(saved.inbox.assets.length, 1);
  assert.equal(saved.inbox.readingList.length, 0);
  assert.equal(saved.asset.markdown, "# Article title\n\nBody");
  assert.equal(saved.asset.usageStatus, "unused");
  assert.equal(saved.asset.authorVerificationType, "blue");
  assert.deepEqual(Array.from(saved.asset.tags), []);
  assert.equal("markdownState" in saved.asset, false);
  assert.throws(() => store.saveArticleAsset(saved.inbox, article({ contentType: "post", content: "Post" })), /Article/u);
});

test("重复保存素材覆盖 Markdown 并保留标签与使用状态", () => {
  const store = backgroundContext().XClipperInboxStore;
  const first = store.saveArticleAsset(store.emptyInbox(), article({ content: "First" }), { id: "asset_1", now: "2026-08-14T00:00:00Z" });
  const updated = store.updateArticleAsset(first.inbox, "asset_1", { tags: ["idea"], usageStatus: "used" }, { now: "2026-08-14T00:30:00Z" });
  const second = store.saveArticleAsset(updated.inbox, article({ content: "Second", title: "New title" }), { id: "asset_2", now: "2026-08-14T01:00:00Z" });
  assert.equal(second.inbox.assets.length, 1);
  assert.equal(second.asset.id, "asset_1");
  assert.equal(second.asset.markdown, "Second");
  assert.equal(second.asset.title, "New title");
  assert.deepEqual(Array.from(second.asset.tags), ["idea"]);
  assert.equal(second.asset.usageStatus, "used");
});

test("作者按 handle 去重并保留认证类型", () => {
  const store = backgroundContext().XClipperInboxStore;
  const first = store.saveAuthor(store.emptyInbox(), { handle: "Example", displayName: "One", authorVerificationType: "blue" }, { id: "author_1", now: "2026-08-14T00:00:00Z" });
  const second = store.saveAuthor(first.inbox, { handle: "@example", displayName: "Two", authorVerificationType: "gold" }, { id: "author_2", now: "2026-08-14T01:00:00Z" });
  assert.equal(second.inbox.authors.length, 1);
  assert.equal(second.author.id, "author_1");
  assert.equal(second.author.displayName, "Two");
  assert.equal(second.author.authorVerificationType, "gold");
  assert.equal(store.saveAuthor(second.inbox, { handle: "example", authorVerificationType: "unknown" }).author.authorVerificationType, "");
  assert.equal(store.removeAuthor(second.inbox, "EXAMPLE").inbox.authors.length, 0);
});

test("Background 暴露统一内容持久化、图片固化与本地阅读协议", () => {
  const background = source("../background.js");
  for (const type of ["read-content-state", "save-content-item", "capture-article-reference", "update-content-item", "remove-content-item", "save-content-author", "remove-content-author", "open-content-reader"]) {
    assert.match(background, new RegExp(`message\\?\\.type === "${type}"`, "u"));
  }
  assert.match(background, /CONTENT_SCRIPT_REVISION = "detail-only-v4"/u);
  assert.match(background, /files: \["i18n\.js", "markdown\.js", "post-snapshot\.js", "content\.js"\]/u);
  assert.match(background, /fetch\(sourceUrl, \{ credentials: "omit", referrerPolicy: "no-referrer" \}\)/u);
  assert.match(background, /new Set\(imageBlocks\.map\(\(block\) => persistentImageUrl\(block\.url\)\)\.filter\(Boolean\)\)/u);
  assert.match(background, /Promise\.all\(Array\.from\(\{ length: Math\.min\(4, sourceUrls\.length\) \}, downloadNext\)\)/u);
  assert.match(background, /preview\.html\?mode=content&itemId=/u);
  assert.match(background, /chrome\.tabs\.create\(\{ url: reference\.sourceUrl, active: false \}\)/u);
  const context = backgroundContext();
  assert.equal(context.previewValue({ authorVerificationType: "blue" }).authorVerificationType, "blue");
  assert.equal(context.previewValue({ authorVerificationType: "gold" }).authorVerificationType, "gold");
  assert.equal(context.previewValue({ authorVerificationType: "unknown" }).authorVerificationType, "");
});

test("Article 详情从当前主 Card 采集作者身份与发布时间", () => {
  const content = source("../content.js");
  assert.match(content, /function articleMetadataRootFromPage\(captureRoot = articleCandidateRootFromPage\(\)\)/u);
  assert.match(content, /const statusRoot = statusSourceCardFromPage\(\);\s*if \(statusRoot\) return statusRoot;/u);
  assert.match(content, /captureRoot\?\.closest\?\.\('article\[data-testid="tweet"\]'\)/u);
  assert.match(content, /root\?\.querySelector\?\.\('\[data-testid="User-Name"\], \[data-testid="UserName"\]'\)/u);
  assert.match(content, /metadataRoot\?\.querySelector\('time\[datetime\]'\)/u);
  assert.match(content, /function authorVerificationTypeFromRoot\(root\)/u);
  assert.match(content, /icon\.querySelector\("linearGradient"\) \? "gold" : "blue"/u);
  assert.match(content, /\.\.\.previewMetadata,\s*authorVerificationType: pageAuthor\.authorVerificationType/u);
  assert.doesNotMatch(content, /authorVerified/u);
  const classify = contentVerificationClassifier();
  assert.equal(classify({ querySelector: () => null }), "");
  assert.equal(classify({ querySelector: () => ({ querySelector: () => null }) }), "blue");
  assert.equal(classify({ querySelector: () => ({ querySelector: () => ({}) }) }), "gold");
});

test("Side Panel 使用 X 原始蓝色与金色认证徽标", () => {
  const script = source("../sidepanel.js");
  const css = source("../sidepanel.css");
  assert.match(script, /function verifiedBadge\(type\)/u);
  assert.match(script, /M20\.396 11c-\.018-\.646/u);
  assert.match(script, /linearGradient[\s\S]*#f4e72a[\s\S]*#e2b719/u);
  assert.match(script, /verifiedBadge\(item\.authorVerificationType\)/u);
  assert.match(script, /verifiedBadge\(author\.authorVerificationType\)/u);
  assert.match(script, /verifiedBadge\(asset\.authorVerificationType\)/u);
  assert.match(css, /\.verified-badge\.is-blue \{ color: var\(--x-blue\); \}/u);
  assert.match(css, /\.author-identity > \.author-handle \{ color: var\(--x-secondary\); \}/u);
  assert.doesNotMatch(css, /\.author-identity span \{/u);
  const renderBadge = sidepanelBadgeRenderer();
  assert.equal(renderBadge(""), "");
  assert.match(renderBadge("blue"), /class="verified-badge is-blue"[\s\S]*M20\.396 11c-\.018-\.646/u);
  const firstGold = renderBadge("gold");
  const secondGold = renderBadge("gold");
  assert.match(firstGold, /class="verified-badge is-gold"[\s\S]*#f4e72a[\s\S]*#d18800/u);
  assert.notEqual(firstGold.match(/id="([^"]+-a)"/u)?.[1], secondGold.match(/id="([^"]+-a)"/u)?.[1]);
});

test("Content Script 只在 Post 或 Article 详情页提供入口", () => {
  const content = source("../content.js");
  assert.match(content, /CONTENT_SCRIPT_REVISION = "detail-only-v4"/u);
  assert.match(content, /function contentCandidateForActionsRoot\(root\)/u);
  assert.match(content, /isArticleSourcePage\(\) \? contentCandidateFromPage\(\) : null/u);
  assert.doesNotMatch(content, /isArticleSourcePage\(\) \? contentCandidateFromPage\(\) : articleCandidateFromListRoot\(root\)/u);
  assert.doesNotMatch(content, /articleCandidateFromListRoot\(root\) \|\| postCandidateFromRoot\(root\)/u);
  assert.match(content, /if \(!isArticleSourcePage\(\)\) \{[\s\S]*list-entry-rejected[\s\S]*return;/u);
  assert.match(content, /if \(!isArticleSourcePage\(\) \|\| !root\?\.isConnected \|\| !matchesSource\(currentCandidate, candidate\.sourceUrl\)\)/u);
  assert.match(content, /if \(!cover && articleMarker < 0 && !isArticlesIndexPage\(\)\) return null;/u);
  const postMenuBranch = /if \(candidate\.contentType === "post"\) \{([\s\S]*?)\n  \} else if/u.exec(content)?.[1] || "";
  assert.match(postMenuBranch, /t\("addReading"\)/u);
  assert.match(postMenuBranch, /t\("copyMarkdown"\)/u);
  assert.match(postMenuBranch, /actionRow\(isAuthorSaved \? t\("removeAuthor"\) : t\("saveAuthor"\), isAuthorSaved \? removeAuthorIcon\(\) : saveAuthorIcon\(\), "author", isAuthorSaved\)/u);
  assert.ok(postMenuBranch.indexOf('t("addReading")') < postMenuBranch.indexOf('t("copyMarkdown")'));
  assert.ok(postMenuBranch.indexOf('t("copyMarkdown")') < postMenuBranch.indexOf('t("removeAuthor")'));
  assert.match(content, /else if \(!isArticleSourcePage\(\)\) \{\s*menu\.append\(actionRow\(isInReadingList \? t\("removeReading"\) : t\("addReading"\)/su);
  assert.match(content, /actionRow\(isInLibrary \? t\("removeMaterial"\) : t\("saveMaterial"\)[\s\S]*actionRow\(t\("previewCopyMarkdown"\)[\s\S]*actionRow\(isAuthorSaved \? t\("removeAuthor"\) : t\("saveAuthor"\)/u);
  assert.match(content, /XClipperPostSnapshot\.createSnapshot/u);
  assert.match(content, /result\.completed \? t\("completedReading"\)/u);
  assert.match(content, /t\("addingReading"\)[\s\S]*t\("savingMaterial"\)/u);
  assert.match(content, /row\.setAttribute\("aria-busy", "true"\)/u);
  assert.match(content, /window\.requestAnimationFrame\(resolve\)/u);
  assert.match(content, /window\.addEventListener\("resize", removeArticleMoreMenu/u);
  assert.match(content, /window\.addEventListener\("scroll", removeArticleMoreMenu/u);
  assert.match(content, /\[x-clipper\] Article menu operation failed\./u);
  assert.doesNotMatch(content, /Could not inject Article menu/u);
  assert.doesNotMatch(content, /toggle-candidate-overlay|capture-current-for-sidepanel|capture-completed|toggle-import-panel|x-clipper-import-panel/u);
});

test("Background 只用严格前缀规则补全已有 Post 快照", () => {
  const background = source("../background.js");
  assert.match(background, /canCompletePostSnapshot\(existing, capture\)/u);
  assert.match(background, /completeCapturedItem\(existing\.id/u);
  assert.match(background, /existing: true, completed: completed\.completed/u);
  assert.match(background, /joinReading: message\.target !== "material"/u);
  assert.match(background, /readingAddedAt: now/u);
});

test("Side Panel 只有待读、素材库和作者三个一级页面", () => {
  const html = source("../sidepanel.html");
  const script = source("../sidepanel.js");
  const css = source("../sidepanel.css");
  const navigation = /<nav class="tabbar"[^>]*>([\s\S]*?)<\/nav>/u.exec(html)?.[1] || "";
  const views = [...html.matchAll(/data-view="([^"]+)"/gu)].map((match) => match[1]);
  assert.deepEqual(views, ["readingList", "assets", "authors"]);
  assert.equal((navigation.match(/<button\b/gu) || []).length, 3);
  assert.doesNotMatch(navigation, /brand-mark|x-clipper-entry/u);
  assert.match(script, /data-action="asset-preview"/u);
  assert.match(script, /type: "open-content-reader", itemId: asset\.id/u);
  assert.match(script, /data-reading-filter="\$\{key\}"/u);
  assert.match(script, /sortControl\("reading", state\.readingSort, state\.readingSortMenu\)/u);
  assert.match(script, /sortControl\("asset", state\.assetSort, state\.assetSortMenu, "x"\)/u);
  assert.match(script, /collection: "reading", sortBy: state\.readingSort/u);
  assert.match(script, /collection: "material", sortBy: state\.assetSort/u);
  assert.match(html, /<script src="sidepanel-sort\.js"><\/script>/u);
  assert.match(html, /<script src="i18n\.js"><\/script>[\s\S]*<script src="sidepanel\.js"><\/script>/u);
  assert.match(script, /data-language-select/u);
  assert.match(script, /i18n\.setLocale/u);
  assert.match(css, /\.sort-trigger--x \{[^}]*display: inline-flex;/u);
  assert.match(css, /\.sort-menu--x \{[^}]*min-width: 240px;/u);
  assert.match(css, /\.sort-menu--x \.is-selected::after \{[^}]*var\(--x-blue\)/u);
  assert.match(script, /sortByMenuTitle/u);
  assert.match(script, /data-action="reading-delete"/u);
  assert.match(script, /data-action="reading-dialog-confirm"/u);
  assert.match(script, /type: "remove-content-item", itemId: target\.dataset\.id/u);
  assert.match(script, /t\("deleteAlsoMaterial"\)/u);
  assert.doesNotMatch(script, /article-card-excerpt/u);
  assert.match(script, /function renderArticleCard\(item,/u);
  assert.match(script, /renderArticleCard\(item, \{ action: "reading-open" \}\)/u);
  assert.match(script, /asset\.contentType === "post"/u);
  assert.match(script, /const postContent = `<a class="post-card-copy" href="\$\{escapeHtml\(asset\.sourceUrl\)\}" target="_blank" rel="noreferrer">/u);
  assert.match(script, /<div class="asset-post-card">\$\{postContent\}\$\{tagRow\}<\/div>/u);
  assert.match(script, /renderArticleCard\(asset, \{ href: asset\.sourceUrl, tags: tagRow \}\)/u);
  assert.doesNotMatch(script, /article-card-button|asset-card-media|asset-card-body/u);
  assert.match(script, /const coverUrl = item\.coverImageUrl \|\| coverBlock\?\.url \|\| ""/u);
  assert.match(css, /\.article-card-media img \{[^}]*object-fit: contain/u);
  assert.match(css, /\.article-card:is\(button\) \{[^}]*appearance: none/u);
  assert.match(css, /\.post-card-text[^}]*-webkit-line-clamp: 4/u);
  assert.match(css, /\.post-card-copy \{[^}]*text-decoration: none;/u);
  assert.match(css, /\.asset-post-card \{ margin-top: 8px; \}/u);
  assert.match(script, /format: "x-clipper-backup", version: 1/u);
  assert.match(script, /data-action="backup-export"/u);
  assert.match(script, /data-action="backup-import"/u);
  assert.match(script, /mergeBackupData/u);
  assert.match(css, /\.data-management \{/u);
  assert.match(script, /usageStatus/u);
  assert.match(script, /data-asset-tag-input/u);
  assert.match(script, /https:\/\/x\.com\/\$\{value\}/u);
  assert.doesNotMatch(`${html}\n${script}`, /候选集|关注作者|统计|导航设置|发布链接|publishedLinks|materialize/u);
});

test("素材标签保存成功后关闭编辑菜单", () => {
  const script = source("../sidepanel.js");
  assert.match(script, /await updateAsset\(asset, \{ tags: \[\.\.\.\(asset\.tags \|\| \[\]\), tag\] \}\);\s*closeAssetMenu\(\);/u);
});

test("素材菜单动作统一关闭，编辑标签保留输入界面", () => {
  const script = source("../sidepanel.js");
  const css = source("../sidepanel.css");
  assert.match(script, /<a data-action="asset-open-original"[^>]*target="_blank" rel="noreferrer"/u);
  assert.match(script, /if \(action === "asset-open-original"\) \{ closeAssetMenu\(\); render\(\); return; \}/u);
  assert.match(script, /if \(action === "asset-toggle-used"\) \{\s*await updateAsset[\s\S]*?closeAssetMenu\(\);/u);
  assert.match(script, /if \(action === "asset-remove-tag"\) \{\s*await updateAsset[\s\S]*?closeAssetMenu\(\);/u);
  assert.match(script, /if \(action === "asset-delete"\) \{ state\.assetDialog = asset\.id; closeAssetMenu\(\); render\(\); \}/u);
  assert.match(script, /if \(action === "asset-tag-editor"\) \{ state\.assetTagEditor = state\.assetTagEditor === asset\.id \? null : asset\.id; render\(\); return; \}/u);
  assert.match(css, /\.asset-menu \{[^}]*min-width: 240px;/u);
  assert.match(css, /\.asset-menu button, \.asset-menu a \{[^}]*white-space: nowrap;/u);
});

test("Preview 支持统一内容本地阅读与旧版临时预览", () => {
  const html = source("../preview.html");
  const script = source("../preview.js");
  const css = source("../preview.css");
  assert.match(html, /id="save"[^>]*hidden/u);
  assert.match(script, /previewMode === "content"/u);
  assert.match(script, /new URLSearchParams\(location\.search\)/u);
  assert.match(script, /chrome\.storage\.local\.get\(CONTENT_INBOX_STORAGE_KEY\)/u);
  assert.match(script, /inbox\.assets\.find\(\(item\) => item\.id === assetId\)/u);
  assert.match(script, /chrome\.storage\.session\.get\(temporaryPreviewKey\)/u);
  assert.match(script, /XClipperContentDatabase\.getItem\(itemId\)/u);
  assert.match(script, /readState: "read"/u);
  assert.match(script, /img \$\{source\}/u);
  assert.doesNotMatch(script, /remove\("library-markdown-preview"\)/u);
  assert.match(css, /\[hidden\] \{ display: none !important; \}/u);
  assert.match(script, /type: "save-article-asset"/u);
  assert.match(script, /contentType: "article"/u);
  assert.match(script, /navigator\.clipboard\.writeText\(preview\.markdown\)/u);
  assert.match(script, /t\("openXOriginal"\)/u);
  assert.doesNotMatch(script, /preview-job|materialize|setInterval|tabs\.create/u);
});

test("项目文档固化 X 同源设计与禁止自动 Chrome 验收", () => {
  const design = source("../docs/development/product-design.md");
  const agents = source("../AGENTS.md");
  assert.match(design, /TwitterChirp/u);
  assert.match(design, /44px/u);
  assert.match(design, /24×24/u);
  assert.match(design, /禁止自动启动 Chrome/u);
  assert.match(design, /Chrome DevTools/u);
  assert.match(agents, /docs\/development\/product-design\.md/u);
});
