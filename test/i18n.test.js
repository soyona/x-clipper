import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../i18n.js", import.meta.url), "utf8");

function i18nHarness({ browserLanguage = "en-US", storedLocale } = {}) {
  const stored = storedLocale ? { "x-clipper-locale": storedLocale } : {};
  const listeners = [];
  const nodes = {
    text: { dataset: { i18n: "readingList" }, textContent: "" },
    label: { dataset: { i18nAriaLabel: "materials" }, setAttribute(name, value) { this[name] = value; } },
  };
  const document = {
    documentElement: { lang: "" },
    querySelectorAll(selector) {
      if (selector === "[data-i18n]") return [nodes.text];
      if (selector === "[data-i18n-aria-label]") return [nodes.label];
      return [];
    },
    querySelector() { return null; },
  };
  const context = {
    document,
    navigator: { language: browserLanguage },
    chrome: {
      i18n: { getUILanguage: () => browserLanguage },
      storage: {
        local: {
          get: async () => ({ ...stored }),
          set: async (value) => Object.assign(stored, value),
        },
        onChanged: { addListener(listener) { listeners.push(listener); } },
      },
    },
    globalThis: null,
  };
  context.globalThis = context;
  runInNewContext(source, context);
  return { i18n: context.XClipperI18n, document, nodes, stored, listeners };
}

test("browser language defaults to English outside Chinese locales", async () => {
  const harness = i18nHarness({ browserLanguage: "fr-FR" });
  await harness.i18n.init();
  assert.equal(harness.i18n.getLocale(), "en");
  assert.equal(harness.i18n.t("readingList"), "Read later");
  assert.equal(harness.document.documentElement.lang, "en");
  assert.equal(harness.nodes.text.textContent, "Read later");
  assert.equal(harness.nodes.label["aria-label"], "Materials");
});

test("Chinese browser language and stored override select the expected locale", async () => {
  const chinese = i18nHarness({ browserLanguage: "zh-TW" });
  await chinese.i18n.init();
  assert.equal(chinese.i18n.getLocale(), "zh-CN");
  assert.equal(chinese.i18n.t("readingList"), "待读");

  const override = i18nHarness({ browserLanguage: "zh-CN", storedLocale: "en" });
  await override.i18n.init();
  assert.equal(override.i18n.getLocale(), "en");
});

test("language selection persists and localizes known cross-module errors", async () => {
  const harness = i18nHarness({ browserLanguage: "en-US" });
  await harness.i18n.init();
  await harness.i18n.setLocale("zh-CN");
  assert.equal(harness.stored["x-clipper-locale"], "zh-CN");
  assert.equal(harness.i18n.localizeError("无法识别当前内容。"), "无法识别当前内容。");
  await harness.i18n.setLocale("en");
  assert.equal(harness.i18n.localizeError("无法识别当前内容。"), "Could not identify the current content.");
  assert.equal(harness.i18n.localizeError("未映射的内部错误。"), "Operation failed");
});

test("every referenced interface key has English and Chinese text", async () => {
  const paths = ["../sidepanel.js", "../preview.js", "../content.js", "../popup.js", "../sidepanel.html", "../preview.html", "../popup.html"];
  const keys = new Set();
  paths.forEach((path) => {
    const value = readFileSync(new URL(path, import.meta.url), "utf8");
    [...value.matchAll(/\bt\("([A-Za-z0-9]+)"/gu)].forEach((match) => keys.add(match[1]));
    [...value.matchAll(/data-i18n(?:-[a-z-]+)?="([A-Za-z0-9]+)"/gu)].forEach((match) => keys.add(match[1]));
  });
  const harness = i18nHarness({ browserLanguage: "en-US" });
  await harness.i18n.init();
  for (const locale of ["en", "zh-CN"]) {
    await harness.i18n.setLocale(locale);
    keys.forEach((key) => assert.notEqual(harness.i18n.t(key), key, `${locale} is missing ${key}`));
  }
  assert.ok(keys.size > 70);
});
