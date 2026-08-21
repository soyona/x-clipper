import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

function databaseTools() {
  const context = { URL, Date, Promise, globalThis: null };
  context.globalThis = context;
  runInNewContext(readFileSync(new URL("../content-store.js", import.meta.url), "utf8"), context);
  runInNewContext(readFileSync(new URL("../content-db.js", import.meta.url), "utf8"), context);
  return context.XClipperContentDatabase;
}

function names(values = []) {
  const entries = new Set(values);
  return { contains: (value) => entries.has(value), entries };
}

test("IndexedDB schema 建立内容、作者、图片和迁移元数据存储", () => {
  const stores = new Map();
  const database = {
    objectStoreNames: names(),
    createObjectStore(name, options) {
      const indexes = new Map();
      const store = {
        name,
        options,
        indexNames: names(),
        createIndex(indexName, keyPath, indexOptions = {}) {
          this.indexNames.entries.add(indexName);
          indexes.set(indexName, { keyPath, options: indexOptions });
        },
        indexes,
      };
      this.objectStoreNames.entries.add(name);
      stores.set(name, store);
      return store;
    },
  };

  const tools = databaseTools();
  tools.upgradeDatabase(database);

  assert.equal(tools.DATABASE_NAME, "x-clipper-content");
  assert.equal(tools.DATABASE_VERSION, 1);
  assert.deepEqual([...database.objectStoreNames.entries], ["items", "authors", "images", "meta"]);
  assert.deepEqual(JSON.parse(JSON.stringify(stores.get("items").options)), { keyPath: "id" });
  assert.deepEqual(JSON.parse(JSON.stringify([...stores.get("items").indexes])), [
    ["sourceUrl", { keyPath: "sourceUrl", options: { unique: true } }],
    ["readState", { keyPath: "readState", options: {} }],
    ["materialState", { keyPath: "materialState", options: {} }],
    ["capturedAt", { keyPath: "capturedAt", options: {} }],
  ]);
});

test("IndexedDB 不可用时给出明确错误", async () => {
  const tools = databaseTools();
  await assert.rejects(tools.openDatabase(), /不支持本地内容数据库/u);
});

test("数据库迁移使用稳定且唯一的 v1 marker", () => {
  const tools = databaseTools();
  assert.equal(tools.MIGRATION_KEY, "legacy-v1-imported");
});

test("数据库提供包含图片的备份读取和非覆盖合并边界", () => {
  const source = readFileSync(new URL("../content-db.js", import.meta.url), "utf8");
  assert.match(source, /async function readBackupData\(\)/u);
  assert.match(source, /async function mergeBackupData\(backupValue\)/u);
  assert.match(source, /if \(!itemIds\.has\(item\.id\)\) \{ itemStore\.add\(item\)/u);
  assert.match(source, /database\.transaction\(\["items", "authors", "images"\], "readwrite"\)/u);
  assert.match(source, /database\.transaction\(\["items", "images"\], "readwrite"\)/u);
});

test("Post 快照补全与图片在同一事务中提交", () => {
  const source = readFileSync(new URL("../content-db.js", import.meta.url), "utf8");
  assert.match(source, /async function completeCapturedItem\(itemId, captureValue/u);
  assert.match(source, /completeCapturedItem\([\s\S]*database\.transaction\(\["items", "images"\], "readwrite"\)/u);
  assert.match(source, /if \(result\.completed\) \{[\s\S]*itemStore\.put\(result\.item\)[\s\S]*imageStore\.put/u);
});
