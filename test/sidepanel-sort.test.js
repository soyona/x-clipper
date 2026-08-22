import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

function sortTools() {
  const context = { Date, globalThis: null };
  context.globalThis = context;
  runInNewContext(readFileSync(new URL("../sidepanel-sort.js", import.meta.url), "utf8"), context);
  return context.XClipperSidePanelSort;
}

function item(id, overrides = {}) {
  return {
    id,
    capturedAt: "2026-08-20T10:00:00Z",
    createdAt: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

test("待读和素材库分别按各自加入时间倒序", () => {
  const tools = sortTools();
  const values = [
    item("a", { readingAddedAt: "2026-08-21T10:00:00Z", materialAddedAt: "2026-08-22T10:00:00Z" }),
    item("b", { readingAddedAt: "2026-08-22T10:00:00Z", materialAddedAt: "2026-08-21T10:00:00Z" }),
  ];

  assert.deepEqual(Array.from(tools.sortItems(values, { collection: "reading" }), (value) => value.id), ["b", "a"]);
  assert.deepEqual(Array.from(tools.sortItems(values, { collection: "material" }), (value) => value.id), ["a", "b"]);
  assert.deepEqual(values.map((value) => value.id), ["a", "b"]);
});

test("旧数据按采集时间回退且无效发布时间沉底", () => {
  const tools = sortTools();
  const values = [
    item("missing", { capturedAt: "2026-08-23T10:00:00Z", publishedAt: null }),
    item("older", { capturedAt: "2026-08-21T10:00:00Z", publishedAt: "2026-08-20T10:00:00Z" }),
    item("newer", { capturedAt: "2026-08-20T10:00:00Z", publishedAt: "2026-08-22T10:00:00Z" }),
  ];

  assert.deepEqual(Array.from(tools.sortItems(values), (value) => value.id), ["missing", "older", "newer"]);
  assert.deepEqual(Array.from(tools.sortItems(values, { sortBy: "published" }), (value) => value.id), ["newer", "older", "missing"]);
});

test("相同发布时间使用加入时间再排序", () => {
  const tools = sortTools();
  const values = [
    item("a", { readingAddedAt: "2026-08-21T10:00:00Z", publishedAt: "2026-08-20T10:00:00Z" }),
    item("b", { readingAddedAt: "2026-08-22T10:00:00Z", publishedAt: "2026-08-20T10:00:00Z" }),
  ];

  assert.deepEqual(Array.from(tools.sortItems(values, { sortBy: "published" }), (value) => value.id), ["b", "a"]);
});
