import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const previewSource = readFileSync(new URL("../preview.js", import.meta.url), "utf8")
  .replace(/\nloadPreview\(\);\s*$/u, "\nglobalThis.loadPreviewForTest = loadPreview;");

function fakeElement({ hidden = false, disabled = false } = {}) {
  return {
    hidden,
    disabled,
    innerHTML: "",
    textContent: "",
    title: "",
    listeners: {},
    classList: { add() {}, remove() {} },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, listener) { this.listeners[type] = listener; },
  };
}

function previewHarness({ search, local = {}, session = {} }) {
  const elements = {
    article: fakeElement(),
    status: fakeElement(),
    copy: fakeElement({ disabled: true }),
    save: fakeElement({ hidden: true }),
    title: fakeElement(),
    subtitle: fakeElement(),
    close: fakeElement(),
  };
  const selectors = {
    "#article": elements.article,
    "#status": elements.status,
    "#copy": elements.copy,
    "#save": elements.save,
    "#preview-title": elements.title,
    "#preview-subtitle": elements.subtitle,
    "#close": elements.close,
  };
  const removed = [];
  const context = {
    URL,
    URLSearchParams,
    Date,
    location: { search },
    window: { close() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    document: {
      title: "",
      querySelector(selector) { return selectors[selector]; },
    },
    chrome: {
      runtime: { sendMessage: async () => ({ ok: true }) },
      storage: {
        local: { get: async (key) => ({ [key]: local[key] }) },
        session: {
          get: async (key) => ({ [key]: session[key] }),
          set: async (values) => Object.assign(session, values),
          remove: async (key) => { removed.push(key); delete session[key]; },
        },
      },
    },
    globalThis: null,
  };
  context.globalThis = context;
  runInNewContext(previewSource, context);
  return { context, elements, local, session, removed };
}

test("素材库 Preview 刷新时按 assetId 从持久素材重新加载", async () => {
  const asset = {
    id: "asset_1",
    title: "Saved Article",
    markdown: "# Saved Article\n\nPersistent body",
    sourceUrl: "https://x.com/example/article/42",
  };
  const local = {
    "x-clipper-content-inbox": { schemaVersion: 1, readingList: [], authors: [], assets: [asset] },
  };
  const harness = previewHarness({ search: "?mode=library&assetId=asset_1", local });

  await harness.context.loadPreviewForTest();
  const firstRender = harness.elements.article.innerHTML;
  await harness.context.loadPreviewForTest();

  assert.equal(harness.elements.article.innerHTML, firstRender);
  assert.match(firstRender, /Saved Article[\s\S]*Persistent body/u);
  assert.equal(harness.elements.copy.disabled, false);
  assert.equal(harness.elements.save.hidden, true);
  assert.deepEqual(harness.removed, []);
});

test("当前 Article Preview 刷新时保留唯一 session 数据且保存状态可恢复", async () => {
  const previewId = "123e4567-e89b-12d3-a456-426614174000";
  const previewKey = `x-clipper-markdown-preview:${previewId}`;
  const session = {
    [previewKey]: {
      title: "Current Article",
      markdown: "# Current Article\n\nTemporary body",
      sourceUrl: "https://x.com/example/article/42",
      canSave: true,
    },
  };
  const harness = previewHarness({ search: `?mode=current&previewId=${previewId}`, session });

  await harness.context.loadPreviewForTest();
  const firstRender = harness.elements.article.innerHTML;
  await harness.context.loadPreviewForTest();
  assert.equal(harness.elements.article.innerHTML, firstRender);
  assert.equal(harness.elements.save.hidden, false);
  assert.deepEqual(harness.removed, []);

  await harness.elements.save.listeners.click();
  assert.equal(session[previewKey].canSave, false);
  await harness.context.loadPreviewForTest();
  assert.equal(harness.elements.save.hidden, true);

  await harness.elements.close.listeners.click();
  assert.deepEqual(harness.removed, [previewKey]);
});

test("多个当前 Article Preview 使用不同 previewId，刷新互不覆盖", async () => {
  const firstId = "123e4567-e89b-12d3-a456-426614174001";
  const secondId = "123e4567-e89b-12d3-a456-426614174002";
  const session = {
    [`x-clipper-markdown-preview:${firstId}`]: { title: "First", markdown: "First body", canSave: true },
    [`x-clipper-markdown-preview:${secondId}`]: { title: "Second", markdown: "Second body", canSave: true },
  };
  const first = previewHarness({ search: `?mode=current&previewId=${firstId}`, session });
  const second = previewHarness({ search: `?mode=current&previewId=${secondId}`, session });

  await first.context.loadPreviewForTest();
  await second.context.loadPreviewForTest();
  await first.context.loadPreviewForTest();

  assert.match(first.elements.article.innerHTML, /First body/u);
  assert.doesNotMatch(first.elements.article.innerHTML, /Second body/u);
  assert.match(second.elements.article.innerHTML, /Second body/u);
  assert.equal(Object.keys(session).length, 2);
});

test("无效 Preview 会隐藏保存与复制操作", async () => {
  const harness = previewHarness({ search: "?mode=library&assetId=missing", local: {} });
  harness.elements.save.hidden = false;
  harness.elements.copy.disabled = false;

  await harness.context.loadPreviewForTest();

  assert.equal(harness.elements.save.hidden, true);
  assert.equal(harness.elements.copy.disabled, true);
  assert.equal(harness.elements.status.textContent, "预览不可用");
});
