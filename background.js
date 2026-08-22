if (typeof importScripts === "function") importScripts("content-store.js", "content-db.js");

function normalizedAuthorVerificationType(value) {
  return value === "blue" || value === "gold" ? value : "";
}

(function registerInboxStore() {
  const SCHEMA_VERSION = 1;

  function normalizedSourceUrl(value) {
    const fallback = String(value || "").split(/[?#]/u)[0].replace(/\/$/u, "");
    try {
      const url = new URL(value);
      const match = url.pathname.match(/^(\/(?:[^/]+\/status|[^/]+\/article|i\/article)\/\d+)/u);
      return match ? `${url.origin}${match[1]}` : fallback;
    } catch {
      return fallback;
    }
  }

  function emptyInbox() {
    return { schemaVersion: SCHEMA_VERSION, readingList: [], authors: [], assets: [] };
  }

  function currentInbox(value) {
    if (value?.schemaVersion !== SCHEMA_VERSION) return emptyInbox();
    return {
      schemaVersion: SCHEMA_VERSION,
      readingList: Array.isArray(value.readingList) ? value.readingList.map((item) => ({ ...item })) : [],
      authors: Array.isArray(value.authors) ? value.authors.map((item) => ({ ...item })) : [],
      assets: Array.isArray(value.assets) ? value.assets.map((item) => ({ ...item })) : [],
    };
  }

  function articleReference(value, { requireMarkdown = false } = {}) {
    const sourceUrl = normalizedSourceUrl(value?.sourceUrl);
    let isSupportedSource = false;
    try {
      const url = new URL(sourceUrl);
      isSupportedSource = ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)
        && /^\/(?:[^/]+\/(?:status|article)|i\/article)\/\d+$/u.test(url.pathname);
    } catch {
      isSupportedSource = false;
    }
    if (!isSupportedSource || value?.contentType !== "article") throw new Error("只能保存有效的 X Article。");
    if (requireMarkdown && !String(value?.content || value?.markdown || "").trim()) throw new Error("没有采集到可用的 Markdown。");
    return { ...value, sourceUrl };
  }

  function saveReadingArticle(inboxValue, reference, { id, now } = {}) {
    const inbox = currentInbox(inboxValue);
    const article = articleReference(reference);
    const existing = inbox.readingList.find((item) => normalizedSourceUrl(item.sourceUrl) === article.sourceUrl);
    const next = {
      id: existing?.id || id,
      contentType: "article",
      sourceUrl: article.sourceUrl,
      title: article.title || "Untitled Article",
      authorHandle: article.authorHandle || "",
      authorName: article.authorName || "",
      authorAvatarUrl: article.authorAvatarUrl || "",
      authorVerificationType: normalizedAuthorVerificationType(article.authorVerificationType),
      coverImageUrl: article.coverImageUrl || "",
      publishedAt: article.publishedAt || null,
      previewExcerpt: article.previewExcerpt || "",
      engagementSnapshot: article.engagementSnapshot || {},
      utilityIconSnapshot: article.utilityIconSnapshot || "",
      addedAt: existing?.addedAt || now,
    };
    inbox.readingList = [next, ...inbox.readingList.filter((item) => normalizedSourceUrl(item.sourceUrl) !== article.sourceUrl)];
    return { inbox, item: next, existing: Boolean(existing) };
  }

  function removeReadingArticle(inboxValue, sourceUrl) {
    const inbox = currentInbox(inboxValue);
    const normalizedUrl = normalizedSourceUrl(sourceUrl);
    const length = inbox.readingList.length;
    inbox.readingList = inbox.readingList.filter((item) => normalizedSourceUrl(item.sourceUrl) !== normalizedUrl);
    return { inbox, removed: inbox.readingList.length !== length };
  }

  function saveArticleAsset(inboxValue, captureValue, { id, now } = {}) {
    const inbox = currentInbox(inboxValue);
    const capture = articleReference(captureValue, { requireMarkdown: true });
    const existing = inbox.assets.find((item) => normalizedSourceUrl(item.sourceUrl) === capture.sourceUrl);
    const asset = {
      id: existing?.id || id,
      contentType: "article",
      sourceUrl: capture.sourceUrl,
      title: capture.title || "Untitled Article",
      authorHandle: capture.authorHandle || "",
      authorName: capture.authorName || "",
      authorAvatarUrl: capture.authorAvatarUrl || "",
      authorVerificationType: normalizedAuthorVerificationType(capture.authorVerificationType),
      coverImageUrl: capture.coverImageUrl || "",
      publishedAt: capture.publishedAt || null,
      previewExcerpt: capture.previewExcerpt || "",
      markdown: String(capture.content || capture.markdown).trim(),
      tags: existing?.tags || [],
      usageStatus: existing?.usageStatus === "used" ? "used" : "unused",
      savedAt: now,
      updatedAt: now,
    };
    inbox.assets = [asset, ...inbox.assets.filter((item) => normalizedSourceUrl(item.sourceUrl) !== capture.sourceUrl)];
    inbox.readingList = inbox.readingList.filter((item) => normalizedSourceUrl(item.sourceUrl) !== capture.sourceUrl);
    return { inbox, asset, existing: Boolean(existing) };
  }

  function updateArticleAsset(inboxValue, assetId, patch, { now } = {}) {
    const inbox = currentInbox(inboxValue);
    const asset = inbox.assets.find((item) => item.id === assetId);
    if (!asset) throw new Error("素材不存在或已被删除。");
    if (Array.isArray(patch?.tags)) asset.tags = [...new Set(patch.tags.map((tag) => String(tag).trim()).filter(Boolean))];
    if (["used", "unused"].includes(patch?.usageStatus)) asset.usageStatus = patch.usageStatus;
    asset.updatedAt = now;
    return { inbox, asset };
  }

  function removeArticleAsset(inboxValue, sourceUrl) {
    const inbox = currentInbox(inboxValue);
    const normalizedUrl = normalizedSourceUrl(sourceUrl);
    const length = inbox.assets.length;
    inbox.assets = inbox.assets.filter((item) => normalizedSourceUrl(item.sourceUrl) !== normalizedUrl);
    return { inbox, removed: inbox.assets.length !== length };
  }

  function saveAuthor(inboxValue, author, { id, now } = {}) {
    const inbox = currentInbox(inboxValue);
    const handle = String(author?.handle || author?.authorHandle || "").replace(/^@/u, "");
    if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) throw new Error("无法识别 Article 作者。");
    const existing = inbox.authors.find((item) => item.handle.toLowerCase() === handle.toLowerCase());
    const item = {
      id: existing?.id || id,
      handle,
      displayName: author.displayName || author.authorName || handle,
      authorAvatarUrl: author.authorAvatarUrl || "",
      authorVerificationType: normalizedAuthorVerificationType(author.authorVerificationType),
      description: author.description || "",
      addedAt: existing?.addedAt || now,
    };
    inbox.authors = [item, ...inbox.authors.filter((value) => value.handle.toLowerCase() !== handle.toLowerCase())];
    return { inbox, author: item, existing: Boolean(existing) };
  }

  function removeAuthor(inboxValue, handleValue) {
    const inbox = currentInbox(inboxValue);
    const handle = String(handleValue || "").replace(/^@/u, "").toLowerCase();
    const length = inbox.authors.length;
    inbox.authors = inbox.authors.filter((item) => item.handle.toLowerCase() !== handle);
    return { inbox, removed: inbox.authors.length !== length };
  }

  globalThis.XClipperInboxStore = {
    SCHEMA_VERSION,
    normalizedSourceUrl,
    emptyInbox,
    currentInbox,
    saveReadingArticle,
    removeReadingArticle,
    saveArticleAsset,
    updateArticleAsset,
    removeArticleAsset,
    saveAuthor,
    removeAuthor,
  };
}());

const CONTENT_INBOX_STORAGE_KEY = "x-clipper-content-inbox";
const CONTENT_SCRIPT_REVISION = "detail-only-v2";
const MARKDOWN_PREVIEW_STORAGE_PREFIX = "x-clipper-markdown-preview:";

function isExpectedTabLifecycleError(error) {
  const message = String(error?.message || error || "").trim();
  return /^(?:Frame with ID \d+ was removed|No tab with id: \d+|No frame with id \d+ in tab \d+|The tab was closed|The frame was removed)\.?$/iu.test(message);
}

function reportContentScriptError(context, error) {
  if (!isExpectedTabLifecycleError(error)) console.error(`[x-clipper] ${context}`, error);
}

function isSupportedXTab(tab) {
  try {
    const url = new URL(tab?.url || tab?.pendingUrl || "");
    return url.protocol === "https:" && ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function ensureContentScript(tab) {
  if (!tab?.id || !isSupportedXTab(tab)) return false;
  try {
    const ready = await chrome.tabs.sendMessage(tab.id, { type: "x-clipper-ready" });
    if (ready?.ok && ready.revision === CONTENT_SCRIPT_REVISION) return true;
  } catch {
    // A missing receiver requires the current packaged content script.
  }
  const currentTab = await chrome.tabs.get(tab.id);
  if (!isSupportedXTab(currentTab)) return false;
  await chrome.scripting.executeScript({ target: { tabId: currentTab.id }, files: ["markdown.js", "post-snapshot.js", "content.js"] });
  const ready = await chrome.tabs.sendMessage(currentTab.id, { type: "x-clipper-ready" });
  if (!ready?.ok || ready.revision !== CONTENT_SCRIPT_REVISION) throw new Error("Content script revision mismatch.");
  return true;
}

function previewValue(capture, { canSave = false } = {}) {
  return {
    contentType: capture?.contentType || "article",
    title: capture?.title || "",
    markdown: capture?.content || capture?.markdown || "",
    authorName: capture?.authorName || "",
    authorHandle: capture?.authorHandle || "",
    authorAvatarUrl: capture?.authorAvatarUrl || "",
    authorVerificationType: normalizedAuthorVerificationType(capture?.authorVerificationType),
    coverImageUrl: capture?.coverImageUrl || "",
    previewExcerpt: capture?.previewExcerpt || "",
    sourceUrl: capture?.sourceUrl || "",
    publishedAt: capture?.publishedAt || null,
    canSave,
  };
}

async function readInbox() {
  const stored = await chrome.storage.local.get(CONTENT_INBOX_STORAGE_KEY);
  return globalThis.XClipperInboxStore.currentInbox(stored[CONTENT_INBOX_STORAGE_KEY]);
}

async function writeInbox(inbox) {
  await chrome.storage.local.set({ [CONTENT_INBOX_STORAGE_KEY]: inbox });
}

async function mutateStore(method, ...args) {
  const result = globalThis.XClipperInboxStore[method](await readInbox(), ...args);
  await writeInbox(result.inbox);
  return result;
}

let contentDatabaseReady = null;

function ensureContentDatabase() {
  if (!contentDatabaseReady) {
    contentDatabaseReady = chrome.storage.local.get(CONTENT_INBOX_STORAGE_KEY)
      .then((stored) => globalThis.XClipperContentDatabase.migrateLegacyInbox(stored[CONTENT_INBOX_STORAGE_KEY]));
  }
  return contentDatabaseReady;
}

async function notifyContentStoreChanged() {
  await chrome.runtime.sendMessage({ type: "content-store-changed" }).catch(() => {});
}

async function imageDigest(blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function persistentImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "pbs.twimg.com" ? url.href : "";
  } catch {
    return "";
  }
}

async function persistCaptureImages(capture) {
  const blocks = Array.isArray(capture?.blocks) ? capture.blocks.map((block) => ({ ...block })) : [];
  const imageBlocks = blocks.filter((block) => block.type === "image");
  const sourceUrls = [...new Set(imageBlocks.map((block) => persistentImageUrl(block.url)).filter(Boolean))];
  const results = new Array(sourceUrls.length);
  let nextSourceIndex = 0;
  const downloadNext = async () => {
    while (nextSourceIndex < sourceUrls.length) {
      const index = nextSourceIndex;
      nextSourceIndex += 1;
      const sourceUrl = sourceUrls[index];
      try {
        const response = await fetch(sourceUrl, { credentials: "omit", referrerPolicy: "no-referrer" });
        if (!response.ok) throw new Error(`图片下载失败（${response.status}）`);
        const blob = await response.blob();
        const id = `image_${await imageDigest(blob)}`;
        results[index] = { id, blob, sourceUrl, mimeType: blob.type || "application/octet-stream", savedAt: new Date().toISOString() };
      } catch {
        results[index] = null;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, sourceUrls.length) }, downloadNext));
  const imageBySourceUrl = new Map(results.filter(Boolean).map((image) => [image.sourceUrl, image]));
  const imageIds = new Set();
  let complete = imageBlocks.every((block) => Boolean(persistentImageUrl(block.url)));
  for (const block of imageBlocks) {
    const image = imageBySourceUrl.get(persistentImageUrl(block.url));
    if (!image) { complete = false; continue; }
    block.imageId = image.id;
    imageIds.add(image.id);
  }
  const images = [...new Map(results.filter(Boolean).map((image) => [image.id, image])).values()];
  return { blocks, imageIds: [...imageIds], images, complete };
}

async function saveCapturedContent(capture, { joinReading = true } = {}) {
  await ensureContentDatabase();
  const now = new Date().toISOString();
  const existing = await globalThis.XClipperContentDatabase.getItemBySourceUrl(capture?.sourceUrl);
  if (existing) {
    if (globalThis.XClipperContentStore.canCompletePostSnapshot(existing, capture)) {
      const persisted = await persistCaptureImages(capture);
      const completed = await globalThis.XClipperContentDatabase.completeCapturedItem(existing.id, {
        ...capture,
        blocks: persisted.blocks,
        imageIds: persisted.imageIds,
        markdown: capture.markdown || capture.content || "",
        previewExcerpt: capture.previewExcerpt || capture.plainText || capture.content || "",
        snapshotState: persisted.complete ? "complete" : "incomplete",
      }, { now, images: persisted.images, joinReading });
      await notifyContentStoreChanged();
      return { item: completed.item, existing: true, completed: completed.completed };
    }
    if (!joinReading) return { item: existing, existing: true };
    const item = existing.readState === "unread"
      ? existing
      : await globalThis.XClipperContentDatabase.updateItemState(existing.id, { readState: "unread", readingAddedAt: now }, { now });
    await notifyContentStoreChanged();
    return { item, existing: true };
  }
  const persisted = await persistCaptureImages(capture);
  const result = await globalThis.XClipperContentDatabase.addCapturedItem({
    ...capture,
    blocks: persisted.blocks,
    imageIds: persisted.imageIds,
    markdown: capture.markdown || capture.content || "",
    previewExcerpt: capture.previewExcerpt || capture.plainText || capture.content || "",
    snapshotState: persisted.complete ? "complete" : "incomplete",
  }, { now, images: persisted.images });
  await notifyContentStoreChanged();
  return result;
}

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      callback(value);
    };
    const timeout = setTimeout(() => {
      finish(reject, new Error("原文页面加载超时，请稍后重试。"));
    }, 30000);
    const listener = (updatedTabId, changeInfo, tab) => {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
      finish(resolve, tab);
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId)
      .then((tab) => { if (tab.status === "complete") finish(resolve, tab); })
      .catch((error) => finish(reject, error));
  });
}

async function captureArticleReference(reference) {
  const tab = await chrome.tabs.create({ url: reference.sourceUrl, active: false });
  try {
    const loaded = tab.status === "complete" ? tab : await waitForTabComplete(tab.id);
    await ensureContentScript(loaded);
    const capture = await chrome.tabs.sendMessage(tab.id, { type: "capture-x" });
    if (capture?.error) throw new Error(capture.error);
    return await saveCapturedContent({ ...capture, ...reference, contentType: "article", sourceUrl: reference.sourceUrl });
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id || !tab.windowId || !chrome.sidePanel?.open) return;
  chrome.sidePanel.open({ windowId: tab.windowId }).catch((error) => reportContentScriptError("Could not open Side Panel.", error));
  ensureContentScript(tab).catch((error) => reportContentScriptError(`Could not initialize tab ${tab.id}.`, error));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const now = () => new Date().toISOString();
  const respond = (promise, fallback) => {
    promise.then((result) => sendResponse({ ok: true, ...result })).catch((error) => sendResponse({ error: error.message || fallback }));
    return true;
  };

  if (message?.type === "save-reading-article") {
    return respond(mutateStore("saveReadingArticle", message.reference, { id: `reading_${crypto.randomUUID()}`, now: now() }), "无法加入待读。");
  }
  if (message?.type === "read-content-state") {
    return respond(ensureContentDatabase().then(() => globalThis.XClipperContentDatabase.readState()).then((state) => ({ state })), "无法读取本地内容。" );
  }
  if (message?.type === "save-content-item") {
    return respond(saveCapturedContent(message.capture, { joinReading: message.target !== "material" }), "无法保存内容。" );
  }
  if (message?.type === "capture-article-reference") {
    return respond(captureArticleReference(message.reference), "无法保存 Article。" );
  }
  if (message?.type === "update-content-item") {
    return respond(
      ensureContentDatabase()
        .then(() => globalThis.XClipperContentDatabase.updateItemState(message.itemId, message.patch, { now: now() }))
        .then(async (item) => { await notifyContentStoreChanged(); return { item }; }),
      "无法更新内容。",
    );
  }
  if (message?.type === "remove-content-item") {
    return respond(
      ensureContentDatabase()
        .then(() => globalThis.XClipperContentDatabase.removeItem(message.itemId))
        .then(async (result) => { await notifyContentStoreChanged(); return result; }),
      "无法删除内容。",
    );
  }
  if (message?.type === "save-content-author") {
    return respond(
      ensureContentDatabase()
        .then(() => globalThis.XClipperContentDatabase.saveAuthor(message.author, { now: now() }))
        .then(async (result) => { await notifyContentStoreChanged(); return result; }),
      "无法收藏作者。",
    );
  }
  if (message?.type === "remove-content-author") {
    return respond(
      ensureContentDatabase()
        .then(() => globalThis.XClipperContentDatabase.removeAuthor(message.handle))
        .then(async (result) => { await notifyContentStoreChanged(); return result; }),
      "无法取消收藏作者。",
    );
  }
  if (message?.type === "open-content-reader") {
    const itemId = String(message.itemId || "");
    return respond(
      chrome.tabs.create({ url: chrome.runtime.getURL(`preview.html?mode=content&itemId=${encodeURIComponent(itemId)}`) })
        .then((tab) => ({ itemId, tabId: tab.id })),
      "无法打开阅读器。",
    );
  }
  if (message?.type === "remove-reading-article") {
    return respond(mutateStore("removeReadingArticle", message.sourceUrl), "无法从待读移除。");
  }
  if (message?.type === "save-article-asset") {
    const operation = message.assetId
      ? mutateStore("updateArticleAsset", message.assetId, message.patch, { now: now() })
      : mutateStore("saveArticleAsset", message.capture, { id: `asset_${crypto.randomUUID()}`, now: now() });
    return respond(operation, "无法保存素材。");
  }
  if (message?.type === "remove-article-asset") {
    return respond(mutateStore("removeArticleAsset", message.sourceUrl), "无法移除素材。");
  }
  if (message?.type === "save-author") {
    return respond(mutateStore("saveAuthor", message.author, { id: `author_${crypto.randomUUID()}`, now: now() }), "无法收藏作者。");
  }
  if (message?.type === "remove-author") {
    return respond(mutateStore("removeAuthor", message.handle), "无法取消收藏作者。");
  }
  if (message?.type === "open-markdown-preview") {
    if (message.assetId) {
      const assetId = String(message.assetId);
      return respond(
        chrome.tabs.create({ url: chrome.runtime.getURL(`preview.html?mode=library&assetId=${encodeURIComponent(assetId)}`) })
          .then((tab) => ({ assetId, tabId: tab.id })),
        "无法打开 Markdown 预览。",
      );
    }
    const previewId = crypto.randomUUID();
    const previewKey = `${MARKDOWN_PREVIEW_STORAGE_PREFIX}${previewId}`;
    const preview = previewValue(message.capture, { canSave: true });
    return respond(
      chrome.storage.session.set({ [previewKey]: preview })
        .then(() => chrome.tabs.create({ url: chrome.runtime.getURL(`preview.html?mode=current&previewId=${encodeURIComponent(previewId)}`) }))
        .then((tab) => ({ previewId, tabId: tab.id })),
      "无法打开 Markdown 预览。",
    );
  }
  if (message?.type === "open-side-panel") {
    const windowId = sender.tab?.windowId;
    const view = ["readingList", "assets", "authors"].includes(message.view) ? message.view : "readingList";
    if (!windowId || !chrome.sidePanel?.open) {
      sendResponse({ error: "请点击扩展图标打开 Side Panel。" });
      return;
    }
    return respond(
      chrome.sidePanel.open({ windowId })
        .then(() => chrome.storage.session.set({ "x-clipper-sidepanel-target": view }))
        .then(() => chrome.runtime.sendMessage({ type: "navigate-sidepanel", view }).catch(() => {}))
        .then(() => ({ view })),
      "无法打开 Side Panel。",
    );
  }
});
