(function registerI18n(global) {
  const STORAGE_KEY = "x-clipper-locale";
  const SUPPORTED_LOCALES = ["en", "zh-CN"];
  const messages = {
    en: {
      readingList: "Read later", materials: "Materials", authors: "Authors", workspace: "X Article Clipper workspace",
      workspaceNavigation: "Workspace navigation", notRecorded: "Not recorded", unknownAuthor: "Unknown author",
      addedTime: "Date added", publishedTime: "Date published", sortMethod: "Sort options", sortBy: "Sort: {label}",
      untitledArticle: "Untitled Article", imageCount: "{count} images", videoOriginalOnly: "Contains video. Play it on X.",
      deleteReadingItem: "Delete saved item", openProfile: "Open {name}'s X profile", readingItemActions: "Saved item actions",
      openOriginal: "Open original", markUnread: "Mark as unread", markRead: "Mark as read",
      unread: "Unread", read: "Read", all: "All", searchReading: "Search saved items",
      searchReadingPlaceholder: "Search content, author, or @handle", readingStatus: "Reading status",
      deleteReadingTitle: "Delete this saved item?", deleteIrreversible: "This cannot be undone.",
      deleteAlsoMaterial: "This will also remove the item from Materials and cannot be undone.", cancel: "Cancel", delete: "Delete",
      emptyReading: "Nothing here yet. Save a Post or Article from its X detail page.",
      openArticles: "Open {name}'s Articles", unfollow: "Unfollow", emptyAuthors: "No saved authors yet. Save an author while reading a valuable Article.",
      language: "Language", languageDescription: "Choose the interface language for this browser.",
      dataManagement: "Data management", dataManagementDescription: "Back up and restore content, images, and states on this device.",
      exportBackup: "Export backup", restoreBackup: "Restore backup", backupExported: "Backup exported · {count} items",
      restoreCompleted: "Restore complete · {items} items and {images} images added",
      removeTag: "Remove tag {tag}", addTagPlaceholder: "Enter a tag and press Enter", addTag: "Add tag", confirmAddTag: "Add tag",
      materialEditor: "Edit material", editTags: "Edit tags", markUnused: "Mark as unused", markUsed: "Mark as used",
      deleteMaterial: "Delete material", tags: "Tags", materialActions: "Material actions", used: "Used", unused: "Unused",
      previewMarkdown: "Preview Markdown", materialCategory: "Material status", searchMaterials: "Search materials",
      searchMaterialsPlaceholder: "Search title, author, @handle, or tag", deleteMaterialTitle: "Delete this material?",
      emptyMaterials: "No materials yet. Save one from an Article detail page.",
      readingDeleted: "Saved item deleted", markedUnread: "Marked as unread", markedRead: "Marked as read", authorRemoved: "Author removed",
      materialDeleted: "Material deleted", tagExists: "Tag already exists", operationFailed: "Operation failed",
      restoreFailed: "Restore failed", loadFailed: "Could not load local data",
      backupImageInvalid: "An image in the backup is invalid.", backupFileInvalid: "The backup is invalid or exceeds 1 GB.",
      backupUnsupported: "This is not a supported X Clipper backup.", localImageReadFailed: "Could not read a local image.",
      actions: "X Article Clipper actions", addingReading: "Saving for later…", savingMaterial: "Saving material…",
      addReading: "Save for later", removeReading: "Remove from Read later", copyMarkdown: "Copy Markdown",
      removeMaterial: "Remove from Materials", saveMaterial: "Save as material", previewCopyMarkdown: "Preview / Copy Markdown",
      saveAuthor: "Save author", removeAuthor: "Remove author", markdownCopied: "Markdown copied", view: "View",
      savedMaterial: "Saved as material · ", removedMaterial: "Removed from Materials", addedReading: "Saved for later · ",
      alreadyReading: "Already in Read later · ", completedReading: "Completed snapshot and saved · ", removedReading: "Removed from Read later",
      savedAuthor: "Author saved · ", removedAuthor: "Author removed", contentNotRecognized: "Could not identify the current content.",
      articlePreviewOnly: "Markdown preview is available for Articles only.", articleMaterialOnly: "Only Articles can be saved directly as materials.",
      staleContent: "The target content has left the page. Reopen the original and try again.",
      changingContent: "The target content changed while it was being saved. Try again.",
      wrongSource: "The current page no longer matches the target content.", sourceChanged: "The original URL changed while the content was being saved.",
      contentReadFailed: "Could not read the content.",
      localReading: "Local reader", markdownPreview: "Markdown preview", savedOnDevice: "Saved on this device",
      reviewThenSave: "Review before saving as material", temporaryOnDevice: "Temporarily shown on this device",
      openXOriginal: "Open original on X", readingView: "{type} reading view", copy: "Copy", copied: "Copied", closePreview: "Close preview",
      articleEmpty: "This Article has no Markdown content to preview.", postEmpty: "This Post has no text to preview.",
      previewDocumentTitle: "Preview", invalidReadingLink: "This reading link is invalid. Return to Read later and open it again.",
      missingReadingItem: "This content no longer exists. Return to Read later and open it again.",
      invalidPreviewLink: "This preview link is invalid. Return to Materials and open it again.",
      missingMaterial: "This material no longer exists. Return to Materials and open it again.",
      invalidXPreviewLink: "This preview link is invalid. Return to X and open it again.",
      expiredPreview: "This preview has expired. Return to X and open it again.", previewOpenFailed: "Could not open the preview.",
      previewUnavailable: "Preview unavailable", markdownCopiedNoImages: "Markdown copied (images excluded)",
      clipboardFailed: "Copy failed. Check clipboard permission.", savedAsMaterial: "Saved as material", saveFailed: "Save failed",
      codeCopied: "Code copied", copyMarkdownTitle: "Copy Markdown · X Article Clipper", copyMarkdownDescription: "Copy the current X content as Markdown. Nothing is uploaded.",
      extractAndCopy: "Extract and copy", preparing: "Preparing…", readingCurrentPage: "Reading the current X page…",
      openPostOrArticle: "Open a Post or Article to extract content.", noContentFound: "No content found. Wait for the page to finish loading.",
      markdownCopiedPeriod: "Markdown copied.", pageReadFailed: "Failed to read the page. Refresh X and try again.",
    },
    "zh-CN": {
      readingList: "待读", materials: "素材库", authors: "作者", workspace: "X Article Clipper Article 工作区",
      workspaceNavigation: "Article 工作区导航", notRecorded: "未记录", unknownAuthor: "未知作者",
      addedTime: "加入时间", publishedTime: "发布时间", sortMethod: "排序方式", sortBy: "排序：{label}",
      untitledArticle: "未命名 Article", imageCount: "共 {count} 张", videoOriginalOnly: "含视频，仅原文可播放",
      deleteReadingItem: "删除待读内容", openProfile: "打开 {name} 的 X 主页", readingItemActions: "待读内容操作",
      openOriginal: "打开原文", markUnread: "标记为未读", markRead: "标记为已读",
      unread: "未读", read: "已读", all: "全部", searchReading: "搜索待读",
      searchReadingPlaceholder: "搜索内容、作者或 @handle", readingStatus: "阅读状态",
      deleteReadingTitle: "删除待读内容？", deleteIrreversible: "删除后无法恢复。",
      deleteAlsoMaterial: "此内容也会从素材库删除，且无法恢复。", cancel: "取消", delete: "删除",
      emptyReading: "这里还没有内容。请在 X 的 Post 或 Article 菜单中加入待读。",
      openArticles: "打开 {name} 的 Articles", unfollow: "取消收藏", emptyAuthors: "还没有收藏作者。阅读优质 Article 时，可以从 X Article Clipper 菜单收藏作者。",
      language: "语言", languageDescription: "选择此浏览器中的界面语言。",
      dataManagement: "数据管理", dataManagementDescription: "备份与恢复此设备上的正文、图片和状态。",
      exportBackup: "导出备份", restoreBackup: "恢复备份", backupExported: "备份已导出 · {count} 条内容",
      restoreCompleted: "恢复完成 · 新增 {items} 条内容、{images} 张图片",
      removeTag: "删除标签 {tag}", addTagPlaceholder: "输入标签后回车", addTag: "添加标签", confirmAddTag: "确认添加标签",
      materialEditor: "素材编辑", editTags: "编辑标签", markUnused: "标记为未使用", markUsed: "标记为已使用",
      deleteMaterial: "删除素材", tags: "标签", materialActions: "素材操作", used: "已使用", unused: "未使用",
      previewMarkdown: "预览 Markdown", materialCategory: "素材分类", searchMaterials: "搜索素材",
      searchMaterialsPlaceholder: "搜索标题、作者、@handle 或标签", deleteMaterialTitle: "删除素材？",
      emptyMaterials: "还没有素材。请在 Article 原文页保存为素材。",
      readingDeleted: "待读内容已删除", markedUnread: "已标记为未读", markedRead: "已标记为已读", authorRemoved: "已取消收藏作者",
      materialDeleted: "素材已删除", tagExists: "标签已存在", operationFailed: "操作失败",
      restoreFailed: "恢复失败", loadFailed: "无法加载本地数据",
      backupImageInvalid: "备份中的图片数据无效。", backupFileInvalid: "备份文件无效或超过 1 GB。",
      backupUnsupported: "这不是受支持的 X Clipper 备份。", localImageReadFailed: "无法读取本地图片。",
      actions: "X Article Clipper 操作", addingReading: "正在加入待读…", savingMaterial: "正在保存素材…",
      addReading: "加入待读", removeReading: "从待读移除", copyMarkdown: "复制 Markdown",
      removeMaterial: "从素材库移除", saveMaterial: "保存为素材", previewCopyMarkdown: "预览 / 复制 Markdown",
      saveAuthor: "收藏作者", removeAuthor: "取消收藏作者", markdownCopied: "Markdown 已复制", view: "查看",
      savedMaterial: "已保存为素材 · ", removedMaterial: "已从素材库移除", addedReading: "已加入待读 · ",
      alreadyReading: "已在待读中 · ", completedReading: "已补全并加入待读 · ", removedReading: "已从待读移除",
      savedAuthor: "已收藏作者 · ", removedAuthor: "已取消收藏作者", contentNotRecognized: "无法识别当前内容。",
      articlePreviewOnly: "只有 Article 支持 Markdown 预览。", articleMaterialOnly: "只有 Article 可以保存为素材。",
      staleContent: "目标内容已离开页面，请重新打开原文后重试。", changingContent: "目标内容在采集过程中发生变化，请重试。",
      wrongSource: "当前页面与目标原文不一致。", sourceChanged: "采集过程中原文地址发生变化，请重试。", contentReadFailed: "无法读取内容。",
      localReading: "本地阅读", markdownPreview: "Markdown 预览", savedOnDevice: "已保存于此设备",
      reviewThenSave: "检查后可保存为素材", temporaryOnDevice: "只在此设备临时展示",
      openXOriginal: "打开 X 原文", readingView: "{type} 阅读视图", copy: "复制", copied: "已复制", closePreview: "关闭预览",
      articleEmpty: "这篇 Article 没有可预览的 Markdown 内容。", postEmpty: "这条 Post 没有可预览的正文。",
      previewDocumentTitle: "预览", invalidReadingLink: "阅读链接无效，请返回待读列表重新打开。",
      missingReadingItem: "内容不存在或已被删除，请返回待读列表重新打开。",
      invalidPreviewLink: "预览链接无效，请返回素材库重新打开。", missingMaterial: "素材不存在或已被删除，请返回素材库重新打开。",
      invalidXPreviewLink: "预览链接无效，请返回 X 重新打开。", expiredPreview: "预览已过期，请返回 X 重新打开。",
      previewOpenFailed: "无法打开预览。", previewUnavailable: "预览不可用", markdownCopiedNoImages: "Markdown 已复制（不含图片）",
      clipboardFailed: "复制失败，请检查剪贴板权限。", savedAsMaterial: "已保存为素材", saveFailed: "保存失败",
      codeCopied: "代码已复制", copyMarkdownTitle: "复制 Markdown · X Article Clipper", copyMarkdownDescription: "将当前 X 内容复制为 Markdown，不会上传任何数据。",
      extractAndCopy: "提取并复制", preparing: "准备中…", readingCurrentPage: "正在读取当前 X 页面…",
      openPostOrArticle: "请打开一个 Post 或 Article 后再提取内容。", noContentFound: "没有找到内容，请等待页面加载完成。",
      markdownCopiedPeriod: "Markdown 已复制。", pageReadFailed: "读取页面失败，请刷新 X 后重试。",
    },
  };

  const knownErrors = {
    "只能保存有效的 X Post 或 Article。": "contentNotRecognized", "内容不存在或已被删除。": "missingReadingItem",
    "当前浏览器不支持本地内容数据库。": "loadFailed", "无法打开本地内容数据库。": "loadFailed",
    "本地数据库升级被其他扩展页面阻止。": "loadFailed", "本地数据库操作失败。": "operationFailed",
    "本地数据库事务已取消。": "operationFailed", "本地数据库事务失败。": "operationFailed",
    "素材不存在或已被删除。": "missingMaterial", "无法识别作者。": "operationFailed", "图片数据无效。": "operationFailed",
    "无法识别当前内容。": "contentNotRecognized", "只有 Article 支持 Markdown 预览。": "articlePreviewOnly",
    "只有 Article 可以保存为素材。": "articleMaterialOnly", "目标内容已离开页面，请重新打开原文后重试。": "staleContent",
    "目标内容在采集过程中发生变化，请重试。": "changingContent", "当前页面与目标原文不一致。": "wrongSource",
    "采集过程中原文地址发生变化，请重试。": "sourceChanged", "无法读取内容。": "contentReadFailed",
  };
  const listeners = new Set();

  function browserLocale() {
    const value = global.chrome?.i18n?.getUILanguage?.() || global.navigator?.language || "en";
    return /^zh(?:-|$)/iu.test(value) ? "zh-CN" : "en";
  }

  let locale = browserLocale();

  function normalizeLocale(value) {
    return value === "zh-CN" || value === "zh" ? "zh-CN" : "en";
  }

  function t(key, values = {}) {
    const template = messages[locale]?.[key] || messages.en[key] || key;
    return template.replace(/\{(\w+)\}/gu, (_, name) => String(values[name] ?? ""));
  }

  function localizeError(message, fallbackKey = "operationFailed") {
    const value = String(message || "");
    if (knownErrors[value]) return t(knownErrors[value]);
    if (locale === "en" && /[一-龥]/u.test(value)) return t(fallbackKey);
    return value || t(fallbackKey);
  }

  function applyDocument(root = global.document) {
    if (!root?.querySelectorAll) return;
    if (root.documentElement) root.documentElement.lang = locale;
    root.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
    ["aria-label", "title", "placeholder"].forEach((attribute) => {
      const dataName = `i18n${attribute.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`;
      root.querySelectorAll(`[data-${dataName.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}]`).forEach((node) => {
        node.setAttribute(attribute, t(node.dataset[dataName]));
      });
    });
    if (root.title && root.querySelector?.("title")?.dataset.i18n) root.title = t(root.querySelector("title").dataset.i18n);
  }

  async function init() {
    try {
      const stored = await global.chrome?.storage?.local?.get?.(STORAGE_KEY);
      if (SUPPORTED_LOCALES.includes(stored?.[STORAGE_KEY])) locale = normalizeLocale(stored[STORAGE_KEY]);
    } catch { /* Browser locale remains the safe fallback. */ }
    applyDocument();
    return locale;
  }

  async function setLocale(nextLocale) {
    locale = normalizeLocale(nextLocale);
    await global.chrome?.storage?.local?.set?.({ [STORAGE_KEY]: locale });
    applyDocument();
    listeners.forEach((listener) => listener(locale));
    return locale;
  }

  global.chrome?.storage?.onChanged?.addListener?.((changes, areaName) => {
    const next = changes?.[STORAGE_KEY]?.newValue;
    if (areaName !== "local" || !SUPPORTED_LOCALES.includes(next) || next === locale) return;
    locale = normalizeLocale(next);
    applyDocument();
    listeners.forEach((listener) => listener(locale));
  });

  global.XClipperI18n = {
    STORAGE_KEY, SUPPORTED_LOCALES, init, setLocale, t, localizeError, applyDocument,
    getLocale: () => locale,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}(globalThis));
