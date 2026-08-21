import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

function contentStore() {
  const context = { URL, globalThis: null };
  context.globalThis = context;
  runInNewContext(readFileSync(new URL("../content-store.js", import.meta.url), "utf8"), context);
  return context.XClipperContentStore;
}

function capture(overrides = {}) {
  return {
    contentType: "post",
    sourceUrl: "https://x.com/example/status/42?ref=share",
    title: "Original Post",
    authorHandle: "example",
    authorName: "Example",
    blocks: [{ type: "paragraph", text: "Original Post" }],
    markdown: "Original Post",
    imageIds: ["image_a"],
    snapshotState: "complete",
    ...overrides,
  };
}

test("schema v2 使用单一内容集合", () => {
  const store = contentStore();
  assert.equal(store.SCHEMA_VERSION, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(store.emptyState())), {
    schemaVersion: 2,
    items: [],
    authors: [],
  });
});

test("Post 与 Article 使用规范化 URL 和稳定内容 ID", () => {
  const store = contentStore();
  assert.equal(store.stableItemId(capture()), "post_42");
  assert.equal(store.stableItemId(capture({
    contentType: "article",
    sourceUrl: "https://x.com/example/article/88#section",
  })), "article_88");
  assert.throws(() => store.stableItemId(capture({ sourceUrl: "https://example.com/status/42" })), /X Post 或 Article/u);
});

test("重复加入不覆盖首次内容快照", () => {
  const store = contentStore();
  const first = store.addCapturedItem(store.emptyState(), capture(), { now: "2026-08-21T10:00:00Z" });
  const duplicate = store.addCapturedItem(first.state, capture({ title: "Edited", markdown: "Edited" }), { now: "2026-08-21T11:00:00Z" });

  assert.equal(duplicate.existing, true);
  assert.equal(duplicate.state.items.length, 1);
  assert.equal(duplicate.item.title, "Original Post");
  assert.equal(duplicate.item.markdown, "Original Post");
  assert.equal(duplicate.item.capturedAt, "2026-08-21T10:00:00Z");
});

test("Post 截断快照只在新正文严格延续旧正文时补全", () => {
  const store = contentStore();
  const truncatedText = "Agents Spec Skill 发布了！\n\n1、容易失忆\n任务进行到一半，AI";
  const fullText = `${truncatedText} 忘了最初的需求、约束和技术决策`;
  const saved = store.addCapturedItem(store.emptyState(), capture({
    title: truncatedText,
    blocks: [{ type: "paragraph", text: truncatedText }],
    markdown: truncatedText,
  }), { now: "2026-08-21T10:00:00Z" });
  const personalized = store.updateItemState(saved.state, "post_42", {
    readState: "read",
    materialState: "used",
    tags: ["coding"],
    openedAt: "2026-08-21T10:30:00Z",
  }, { now: "2026-08-21T10:30:00Z" });

  const completed = store.completeCapturedItem(personalized.state, "post_42", capture({
    title: fullText,
    plainText: fullText,
    blocks: [{ type: "paragraph", text: fullText }],
    markdown: fullText,
    imageIds: ["image_b"],
  }), { now: "2026-08-21T11:00:00Z" });

  assert.equal(completed.completed, true);
  assert.equal(completed.item.markdown, fullText);
  assert.equal(completed.item.blocks[0].text, fullText);
  assert.equal(completed.item.readState, "unread");
  assert.equal(completed.item.materialState, "used");
  assert.deepEqual(Array.from(completed.item.tags), ["coding"]);
  assert.equal(completed.item.capturedAt, "2026-08-21T10:00:00Z");
  assert.equal(completed.item.firstOpenedAt, "2026-08-21T10:30:00Z");
  assert.equal(completed.item.createdAt, "2026-08-21T10:00:00Z");
  assert.equal(completed.item.updatedAt, "2026-08-21T11:00:00Z");
});

test("Post 非前缀变更和 Article 都不能覆盖已有快照", () => {
  const store = contentStore();
  const saved = store.addCapturedItem(store.emptyState(), capture(), { now: "2026-08-21T10:00:00Z" });

  assert.equal(store.canCompletePostSnapshot(saved.item, capture({
    title: "Edited Original Post with more text",
    plainText: "Edited Original Post with more text",
    blocks: [{ type: "paragraph", text: "Edited Original Post with more text" }],
  })), false);
  assert.equal(store.canCompletePostSnapshot(saved.item, capture()), false);
  assert.equal(store.canCompletePostSnapshot(saved.item, capture({
    contentType: "article",
    sourceUrl: "https://x.com/example/article/42",
    plainText: "Original Post with more text",
  })), false);
});

test("阅读状态与素材状态独立更新", () => {
  const store = contentStore();
  const saved = store.addCapturedItem(store.emptyState(), capture(), { now: "2026-08-21T10:00:00Z" });
  const material = store.updateItemState(saved.state, "post_42", {
    materialState: "unused",
    tags: [" idea ", "idea", "writing"],
  }, { now: "2026-08-21T11:00:00Z" });
  const read = store.updateItemState(material.state, "post_42", {
    readState: "read",
    openedAt: "2026-08-21T12:00:00Z",
  }, { now: "2026-08-21T12:00:00Z" });

  assert.equal(read.item.readState, "read");
  assert.equal(read.item.materialState, "unused");
  assert.deepEqual(Array.from(read.item.tags), ["idea", "writing"]);
  assert.equal(read.item.firstOpenedAt, "2026-08-21T12:00:00Z");
});

test("v1 待读与素材迁移为同一 ContentItem 模型并保留作者", () => {
  const store = contentStore();
  const legacy = {
    schemaVersion: 1,
    readingList: [{
      id: "reading_1",
      contentType: "article",
      sourceUrl: "https://x.com/reader/article/10",
      title: "Read later",
      addedAt: "2026-08-20T10:00:00Z",
    }],
    assets: [{
      id: "asset_1",
      contentType: "article",
      sourceUrl: "https://x.com/writer/article/20",
      title: "Material",
      markdown: "# Material\n\nBody",
      tags: ["draft"],
      usageStatus: "used",
      savedAt: "2026-08-19T10:00:00Z",
    }],
    authors: [{ id: "author_1", handle: "@Example", authorVerificationType: "gold" }],
  };

  const migrated = store.migrateLegacyInbox(legacy);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.items.length, 2);
  const reading = migrated.items.find((item) => item.sourceUrl.endsWith("/10"));
  const material = migrated.items.find((item) => item.sourceUrl.endsWith("/20"));
  assert.equal(reading.readState, "unread");
  assert.equal(reading.materialState, "none");
  assert.equal(reading.snapshotState, "incomplete");
  assert.equal(material.readState, "read");
  assert.equal(material.materialState, "used");
  assert.equal(material.markdown, "# Material\n\nBody");
  assert.equal(material.snapshotState, "incomplete");
  assert.equal(migrated.authors[0].handle, "example");
  assert.equal(migrated.authors[0].authorVerificationType, "gold");
});

test("v1 同 URL 素材覆盖待读引用且迁移可重复执行", () => {
  const store = contentStore();
  const sourceUrl = "https://x.com/example/article/99";
  const legacy = {
    schemaVersion: 1,
    readingList: [{ contentType: "article", sourceUrl, title: "Reference" }],
    assets: [{ contentType: "article", sourceUrl, title: "Captured", markdown: "Captured", usageStatus: "unused" }],
    authors: [],
  };
  const migrated = store.migrateLegacyInbox(legacy);
  const migratedAgain = store.migrateLegacyInbox(migrated);

  assert.equal(migrated.items.length, 1);
  assert.equal(migrated.items[0].title, "Captured");
  assert.equal(migrated.items[0].materialState, "unused");
  assert.deepEqual(JSON.parse(JSON.stringify(migratedAgain)), JSON.parse(JSON.stringify(migrated)));
});
