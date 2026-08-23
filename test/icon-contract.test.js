import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { inflateSync } from "node:zlib";

const text = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const bytes = (path) => readFileSync(new URL(path, import.meta.url));
const BRAND_RING_PATH = "M16.7 5.3C12 1.9 5.3 4 3.9 9.7 2.5 15.4 7.4 20.5 13.3 19.7L14.2 19.15";
const BRAND_PENCIL_PATH = "m14.2 19.15 1-2.9 4.55-4.55 2.6 2.6-4.55 4.55-3.6.3";
const OFFICIAL_X_PATH_PREFIX = "M21.742 21.75";
const OFFICIAL_BOOKMARK_OUTLINE = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z";
const OFFICIAL_BOOKMARK_FILLED = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z";

function decodedPng(path) {
  const png = bytes(path);
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8);
      channels = ({ 2: 3, 6: 4 })[data[9]] || 0;
      assert.ok(channels, `Unsupported PNG color type: ${data[9]}`);
    } else if (type === "IDAT") idat.push(data);
    offset += length + 12;
  }
  const filtered = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    const source = y * (stride + 1) + 1;
    const target = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[source + x];
      const left = x >= channels ? pixels[target + x - channels] : 0;
      const above = y ? pixels[target + x - stride] : 0;
      const upperLeft = y && x >= channels ? pixels[target + x - stride - channels] : 0;
      const predictor = filter === 0 ? 0
        : filter === 1 ? left
          : filter === 2 ? above
            : filter === 3 ? Math.floor((left + above) / 2)
              : filter === 4 ? paeth(left, above, upperLeft)
                : assert.fail(`Unsupported PNG filter: ${filter}`);
      pixels[target + x] = (raw + predictor) & 255;
    }
  }
  return { width, height, channels, pixels };
}

function inkPixels(image, { left, top, width, height }) {
  let count = 0;
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      const offset = (y * image.width + x) * image.channels;
      if (image.pixels[offset] < 245 || image.pixels[offset + 1] < 245 || image.pixels[offset + 2] < 245) count += 1;
    }
  }
  return count;
}

function destructivePixels(image, { left, top, width, height }) {
  let count = 0;
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      const offset = (y * image.width + x) * image.channels;
      if (image.pixels[offset] > 200 && image.pixels[offset + 1] < 90 && image.pixels[offset + 2] < 100) count += 1;
    }
  }
  return count;
}

test("品牌矢量使用独立黑白铅笔书写图形", () => {
  const appIcon = text("../assets/icons/x-clipper-icon-source.svg");
  const entryIcon = text("../assets/icons/x-clipper-entry.svg");

  for (const source of [appIcon, entryIcon]) {
    assert.doesNotMatch(source, /gradient|filter|shadow/iu);
    assert.doesNotMatch(source, new RegExp(OFFICIAL_X_PATH_PREFIX.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
    assert.match(source, new RegExp(BRAND_RING_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
    assert.match(source, new RegExp(BRAND_PENCIL_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.match(appIcon, /viewBox="0 0 128 128"/u);
  assert.match(appIcon, /fill="#000"/u);
  assert.match(appIcon, /color="#fff"/u);
  assert.match(entryIcon, /viewBox="0 0 24 24"/u);
  assert.match(entryIcon, /currentColor/u);
});

test("Manifest 的四个图标尺寸由新品牌源生成", () => {
  const manifest = JSON.parse(text("../manifest.json"));
  for (const size of [16, 32, 48, 128]) {
    const path = `assets/icons/x-clipper-icon-${size}.png`;
    assert.equal(manifest.icons[String(size)], path);
    assert.equal(manifest.action.default_icon[String(size)], path);
    const png = bytes(`../${path}`);
    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test("产品内入口和动作菜单共享选中方案的图标契约", () => {
  const content = text("../content.js");
  const panelHtml = text("../sidepanel.html");
  const panelScript = text("../sidepanel.js");
  const panelCss = text("../sidepanel.css");
  const previewHtml = text("../preview.html");
  const iconSpec = text("../docs/design/icon-system.md");
  const iconLibrary = text("../assets/icons/x-clipper-ui-icons.svg");
  const iconBoard = text("../docs/design/x-clipper-ui-icon-spec.svg");

  assert.match(content, new RegExp(BRAND_RING_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(content, new RegExp(BRAND_PENCIL_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.doesNotMatch(content, new RegExp(OFFICIAL_X_PATH_PREFIX.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.doesNotMatch(panelHtml, /assets\/icons\/x-clipper-entry\.svg/u);
  assert.equal((panelHtml.match(/class="nav-icon-outline"/gu) || []).length, 3);
  assert.equal((panelHtml.match(/class="nav-icon-filled"/gu) || []).length, 3);
  assert.match(panelScript, /t\("openOriginal"\)[\s\S]*t\("editTags"\)[\s\S]*t\("markUnused"\)[\s\S]*t\("deleteMaterial"\)/u);
  assert.match(panelScript, /previewMarkdownIcon\(\)[\s\S]*t\("previewMarkdown"\)/u);
  assert.match(panelScript, /readingRemoveIcon\(\)/u);
  assert.match(content, /readingTrayIcon\(isInReadingList\)/u);
  assert.match(content, /libraryBookmarkIcon\(isInLibrary\)/u);
  assert.match(content, /setMenuRowIcon\(row, icon, inverse\)/u);
  assert.match(content, /inverse \? "#f4212e" : "currentColor"/u);
  assert.match(panelCss, /\.tab\.is-active \{ background: transparent; color: var\(--x-blue\); \}/u);
  assert.match(panelCss, /\.tab\.is-active \.nav-icon-filled \{ display: block; \}/u);
  assert.match(panelCss, /\.asset-menu-item-icon[^{]*\{[^}]*width: 24px;[^}]*height: 24px;[^}]*margin-right: 12px;/u);
  assert.match(panelCss, /\.asset-menu \.is-destructive[^}]*color: var\(--x-error\)/u);
  assert.match(previewHtml, /id="save"[\s\S]*M5 3\.5A2\.5 2\.5[\s\S]*M19 6v5M16\.5 8\.5h5/u);
  const requiredSymbols = [
    "nav-reading-outline", "nav-reading-filled", "nav-library-outline", "nav-library-filled",
    "nav-authors-outline", "nav-authors-filled", "reading-add", "reading-remove", "library-add",
    "library-remove", "article-preview", "markdown-copy", "author-add", "author-remove",
    "open-original", "edit-tags", "mark-used", "mark-unused", "delete", "search", "more",
    "add", "close", "copy", "verified-blue", "verified-gold",
  ];
  const symbolIds = [...iconLibrary.matchAll(/<symbol id="([^"]+)"/gu)].map((match) => match[1]);
  const boardSymbolIds = [...iconBoard.matchAll(/<symbol id="([^"]+)"/gu)].map((match) => match[1]);
  assert.equal(new Set(symbolIds).size, symbolIds.length);
  assert.deepEqual(symbolIds, requiredSymbols);
  assert.deepEqual(boardSymbolIds, symbolIds);
  assert.doesNotMatch(iconBoard, /<use href="(?!#)/u);
  assert.match(iconLibrary, new RegExp(OFFICIAL_BOOKMARK_OUTLINE.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(iconLibrary, new RegExp(OFFICIAL_BOOKMARK_FILLED.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(content, new RegExp(OFFICIAL_BOOKMARK_OUTLINE.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(content, new RegExp(OFFICIAL_BOOKMARK_FILLED.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(iconBoard, /class="destructive"[^>]*><use href="#reading-remove"/u);
  assert.match(iconBoard, /class="destructive"[^>]*><use href="#library-remove"/u);
  assert.match(iconBoard, /class="destructive"[^>]*><use href="#author-remove"/u);
  const authorAddPerson = /<symbol id="author-add"[^>]*>(<g fill="currentColor">[\s\S]*?<\/g>)/u.exec(iconLibrary)?.[1];
  const authorRemovePerson = /<symbol id="author-remove"[^>]*>(<g fill="currentColor">[\s\S]*?<\/g>)/u.exec(iconLibrary)?.[1];
  assert.ok(authorAddPerson);
  assert.equal(authorAddPerson, authorRemovePerson);
  assert.match(iconLibrary, /<symbol id="author-add"[^>]*>[\s\S]*M18\.5 5\.5v4m-2-2h4[\s\S]*stroke-width="2"/u);
  assert.match(iconLibrary, /<symbol id="author-remove"[^>]*>[\s\S]*<circle cx="9" cy="6\.5" r="3"\/>[\s\S]*M3\.25 20c\.3-5\.35[\s\S]*m16\.5 5\.5 4 4m0-4-4 4[\s\S]*stroke-width="2"/u);
  assert.match(content, /const AUTHOR_PERSON_GEOMETRY = '[^']*circle cx="9" cy="6\.5" r="3"[^']*M3\.25 20c\.3-5\.35[^']*'/u);
  assert.match(content, /function saveAuthorIcon\(\)[\s\S]*\$\{AUTHOR_PERSON_GEOMETRY\}[\s\S]*M18\.5 5\.5v4m-2-2h4/u);
  assert.match(content, /function removeAuthorIcon\(\)[\s\S]*\$\{AUTHOR_PERSON_GEOMETRY\}[\s\S]*m16\.5 5\.5 4 4m0-4-4 4/u);
  for (const id of requiredSymbols.filter((id) => !id.startsWith("verified-"))) assert.match(iconBoard, new RegExp(`#${id}\\b`, "u"));
  assert.match(iconSpec, /认证徽标不是动作图标/u);
  assert.match(content, /M5 2\.5h9l4 4V11[\s\S]*width="8\.5" height="9\.5"/u);
  assert.match(content, /M7\.5 14s1\.7-3 4\.5-3[\s\S]*circle cx="12" cy="14" r="1\.25"/u);
  assert.match(panelScript, /M7\.5 14s1\.7-3 4\.5-3[\s\S]*circle cx="12" cy="14" r="1\.25"/u);
  assert.match(iconSpec, /项目内图标选择、实现和验收的单一权威规范/u);
  assert.match(iconSpec, /禁止临时内联自创 path、emoji 或 Unicode 图标/u);
  assert.match(iconSpec, /Active：`#1d9bf0` 填充图标，不显示持续边框或焦点环/u);
  assert.match(iconSpec, /三种反向动作均只将图标设为 X destructive `#f4212e`，标签保持中性色/u);
  assert.match(iconSpec, /不得再叠加微小的 `\+`／`−`/u);
  assert.match(iconSpec, /`author-add` 与 `author-remove` 必须复用完全相同的实心单人头像与躯干几何/u);
});

test("最终图标规范图由矢量规范和图标库共同交付", () => {
  const board = text("../docs/design/x-clipper-ui-icon-spec.svg");
  const png = bytes("../docs/design/x-clipper-ui-icon-spec.png");
  assert.match(board, new RegExp(BRAND_RING_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(board, new RegExp(BRAND_PENCIL_PATH.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.doesNotMatch(board, new RegExp(OFFICIAL_X_PATH_PREFIX.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(board, /X Article Clipper UI Icon System/u);
  assert.match(board, /Final · 24×24 semantic icon source · X light/u);
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 1440);
  assert.equal(png.readUInt32BE(20), 1020);
  const image = decodedPng("../docs/design/x-clipper-ui-icon-spec.png");
  assert.ok(inkPixels(image, { left: 230, top: 390, width: 40, height: 40 }) > 100, "Navigation icon must be visible");
  assert.ok(inkPixels(image, { left: 60, top: 650, width: 40, height: 40 }) > 100, "X menu icon must be visible");
  assert.ok(inkPixels(image, { left: 60, top: 816, width: 40, height: 40 }) > 100, "Side Panel icon must be visible");
  assert.ok(destructivePixels(image, { left: 205, top: 650, width: 40, height: 40 }) > 100, "Remove reading icon must be destructive red");
  assert.ok(destructivePixels(image, { left: 530, top: 650, width: 40, height: 40 }) > 100, "Remove library icon must be destructive red");
  assert.ok(destructivePixels(image, { left: 1195, top: 650, width: 40, height: 40 }) > 50, "Remove author icon must be destructive red");
});
