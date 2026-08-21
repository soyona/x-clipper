(function registerContentStore() {
  const SCHEMA_VERSION = 2;
  const CONTENT_TYPES = new Set(["article", "post"]);
  const SNAPSHOT_STATES = new Set(["complete", "incomplete", "failed"]);
  const READ_STATES = new Set(["unread", "read"]);
  const MATERIAL_STATES = new Set(["none", "unused", "used"]);
  const MEDIA_NOTICES = new Set(["none", "video", "audio", "mixed"]);

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

  function supportedContent(value) {
    const contentType = CONTENT_TYPES.has(value?.contentType) ? value.contentType : "";
    const sourceUrl = normalizedSourceUrl(value?.sourceUrl);
    let supportedUrl = false;
    try {
      const url = new URL(sourceUrl);
      supportedUrl = ["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)
        && /^\/(?:[^/]+\/(?:status|article)|i\/article)\/\d+$/u.test(url.pathname);
    } catch {
      supportedUrl = false;
    }
    if (!contentType || !supportedUrl) throw new Error("只能保存有效的 X Post 或 Article。");
    return { contentType, sourceUrl };
  }

  function normalizedAuthorVerificationType(value) {
    return value === "blue" || value === "gold" ? value : "";
  }

  function normalizedTags(value) {
    return [...new Set((Array.isArray(value) ? value : [])
      .map((tag) => String(tag).trim())
      .filter(Boolean))];
  }

  function stableItemId(value) {
    const { contentType, sourceUrl } = supportedContent(value);
    return `${contentType}_${sourceUrl.split("/").pop()}`;
  }

  function emptyState() {
    return { schemaVersion: SCHEMA_VERSION, items: [], authors: [] };
  }

  function normalizedItem(value) {
    const { contentType, sourceUrl } = supportedContent(value);
    return {
      id: String(value?.id || stableItemId(value)),
      contentType,
      sourceUrl,
      title: String(value?.title || (contentType === "article" ? "Untitled Article" : "Untitled Post")),
      authorHandle: String(value?.authorHandle || ""),
      authorName: String(value?.authorName || ""),
      authorAvatarUrl: String(value?.authorAvatarUrl || ""),
      authorVerificationType: normalizedAuthorVerificationType(value?.authorVerificationType),
      coverImageUrl: String(value?.coverImageUrl || ""),
      publishedAt: value?.publishedAt || null,
      previewExcerpt: String(value?.previewExcerpt || ""),
      blocks: Array.isArray(value?.blocks) ? value.blocks.map((block) => ({ ...block })) : [],
      markdown: String(value?.markdown || value?.content || "").trim(),
      imageIds: Array.isArray(value?.imageIds) ? [...new Set(value.imageIds.map(String).filter(Boolean))] : [],
      mediaNotice: MEDIA_NOTICES.has(value?.mediaNotice) ? value.mediaNotice : "none",
      snapshotState: SNAPSHOT_STATES.has(value?.snapshotState) ? value.snapshotState : "incomplete",
      readState: READ_STATES.has(value?.readState) ? value.readState : "unread",
      materialState: MATERIAL_STATES.has(value?.materialState) ? value.materialState : "none",
      tags: normalizedTags(value?.tags),
      capturedAt: value?.capturedAt || null,
      firstOpenedAt: value?.firstOpenedAt || null,
      lastOpenedAt: value?.lastOpenedAt || null,
      createdAt: value?.createdAt || null,
      updatedAt: value?.updatedAt || null,
    };
  }

  function normalizedAuthor(value) {
    const handle = String(value?.handle || "").replace(/^@/u, "").toLowerCase();
    return {
      ...value,
      handle,
      authorVerificationType: normalizedAuthorVerificationType(value?.authorVerificationType),
    };
  }

  function currentState(value) {
    if (value?.schemaVersion !== SCHEMA_VERSION) return emptyState();
    return {
      schemaVersion: SCHEMA_VERSION,
      items: Array.isArray(value.items) ? value.items.map(normalizedItem) : [],
      authors: Array.isArray(value.authors) ? value.authors.map(normalizedAuthor) : [],
    };
  }

  function addCapturedItem(stateValue, captureValue, { id, now } = {}) {
    const state = currentState(stateValue);
    const capture = normalizedItem({
      ...captureValue,
      id: id || captureValue?.id,
      capturedAt: captureValue?.capturedAt || now || null,
      createdAt: captureValue?.createdAt || now || null,
      updatedAt: now || captureValue?.updatedAt || null,
    });
    const existing = state.items.find((item) => item.sourceUrl === capture.sourceUrl);
    if (existing) return { state, item: existing, existing: true };
    state.items = [capture, ...state.items];
    return { state, item: capture, existing: false };
  }

  function snapshotPlainText(value) {
    const blockText = (Array.isArray(value?.blocks) ? value.blocks : [])
      .filter((block) => block?.type !== "image" && block?.text)
      .map((block) => String(block.text).trim())
      .filter(Boolean)
      .join("\n\n");
    return String(value?.plainText || blockText || value?.markdown || value?.content || "").trim();
  }

  function canCompletePostSnapshot(existingValue, captureValue) {
    if (existingValue?.contentType !== "post" || captureValue?.contentType !== "post") return false;
    if (normalizedSourceUrl(existingValue.sourceUrl) !== normalizedSourceUrl(captureValue.sourceUrl)) return false;
    const existingText = snapshotPlainText(existingValue);
    const captureText = snapshotPlainText(captureValue);
    return Boolean(existingText && captureText.length > existingText.length && captureText.startsWith(existingText));
  }

  function completeCapturedItem(stateValue, itemId, captureValue, { now } = {}) {
    const state = currentState(stateValue);
    const existing = state.items.find((candidate) => candidate.id === itemId);
    if (!existing) throw new Error("内容不存在或已被删除。");
    if (!canCompletePostSnapshot(existing, captureValue)) return { state, item: existing, completed: false };
    const item = normalizedItem({
      ...existing,
      ...captureValue,
      id: existing.id,
      readState: "unread",
      materialState: existing.materialState,
      tags: existing.tags,
      capturedAt: existing.capturedAt,
      firstOpenedAt: existing.firstOpenedAt,
      lastOpenedAt: existing.lastOpenedAt,
      createdAt: existing.createdAt,
      updatedAt: now || existing.updatedAt,
    });
    state.items = state.items.map((candidate) => candidate.id === itemId ? item : candidate);
    return { state, item, completed: true };
  }

  function updateItemState(stateValue, itemId, patchValue, { now } = {}) {
    const state = currentState(stateValue);
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error("内容不存在或已被删除。");
    if (READ_STATES.has(patchValue?.readState)) item.readState = patchValue.readState;
    if (MATERIAL_STATES.has(patchValue?.materialState)) item.materialState = patchValue.materialState;
    if (Array.isArray(patchValue?.tags)) item.tags = normalizedTags(patchValue.tags);
    if (patchValue?.openedAt) {
      item.firstOpenedAt ||= patchValue.openedAt;
      item.lastOpenedAt = patchValue.openedAt;
    }
    item.updatedAt = now || item.updatedAt;
    return { state, item };
  }

  function migrateLegacyInbox(value) {
    if (value?.schemaVersion === SCHEMA_VERSION) return currentState(value);
    if (value?.schemaVersion !== 1) return emptyState();
    const state = emptyState();
    const bySource = new Map();

    for (const legacy of Array.isArray(value.readingList) ? value.readingList : []) {
      const item = normalizedItem({
        ...legacy,
        id: stableItemId({ ...legacy, contentType: "article" }),
        contentType: "article",
        snapshotState: "incomplete",
        readState: "unread",
        materialState: "none",
        capturedAt: null,
        createdAt: legacy.addedAt || null,
        updatedAt: legacy.addedAt || null,
      });
      bySource.set(item.sourceUrl, item);
    }

    for (const legacy of Array.isArray(value.assets) ? value.assets : []) {
      const item = normalizedItem({
        ...legacy,
        id: stableItemId({ ...legacy, contentType: "article" }),
        contentType: "article",
        markdown: legacy.markdown,
        snapshotState: "incomplete",
        readState: "read",
        materialState: legacy.usageStatus === "used" ? "used" : "unused",
        capturedAt: legacy.savedAt || null,
        createdAt: legacy.savedAt || null,
        updatedAt: legacy.updatedAt || legacy.savedAt || null,
      });
      bySource.set(item.sourceUrl, item);
    }

    state.items = [...bySource.values()];
    state.authors = (Array.isArray(value.authors) ? value.authors : []).map(normalizedAuthor);
    return state;
  }

  globalThis.XClipperContentStore = {
    SCHEMA_VERSION,
    addCapturedItem,
    canCompletePostSnapshot,
    completeCapturedItem,
    currentState,
    emptyState,
    migrateLegacyInbox,
    normalizedSourceUrl,
    snapshotPlainText,
    stableItemId,
    updateItemState,
  };
}());
