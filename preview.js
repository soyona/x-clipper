const article = document.querySelector("#article");
const status = document.querySelector("#status");
const copyButton = document.querySelector("#copy");
const saveButton = document.querySelector("#save");
const previewTitle = document.querySelector("#preview-title");
const previewSubtitle = document.querySelector("#preview-subtitle");
const CONTENT_INBOX_STORAGE_KEY = "x-clipper-content-inbox";
const MARKDOWN_PREVIEW_STORAGE_PREFIX = "x-clipper-markdown-preview:";
let preview = null;
let temporaryPreviewKey = "";
let previewMode = "";

function text(value) {
  return String(value || "");
}

function escapeHtml(value) {
  return text(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? text(value) : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

function authorProfileUrl(handle) {
  const normalized = text(handle).replace(/^@/u, "");
  return /^[A-Za-z0-9_]{1,15}$/u.test(normalized) ? `https://x.com/${normalized}` : "";
}

function metadata(value) {
  const profileUrl = authorProfileUrl(value.authorHandle);
  const authorName = text(value.authorName);
  const handle = text(value.authorHandle).replace(/^@/u, "");
  const author = profileUrl
    ? `<a href="${escapeHtml(profileUrl)}" target="_blank" rel="noreferrer">${escapeHtml(authorName || `@${handle}`)}${handle ? ` @${escapeHtml(handle)}` : ""}</a>`
    : escapeHtml([authorName, handle ? `@${handle}` : ""].filter(Boolean).join(" "));
  const publishedAt = value.publishedAt ? `<span>${escapeHtml(formatDate(value.publishedAt))}</span>` : "";
  return [author, publishedAt].filter(Boolean).join(" · ");
}

function markdownInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/gu, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gu, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdown(markdown, title = "") {
  const lines = text(markdown).replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let codeLines = [];
  let codeLanguage = "";
  let inCode = false;
  let listType = "";
  const closeList = () => { if (listType) output.push(`</${listType}>`); listType = ""; };
  const closeCode = () => {
    if (!inCode) return;
    output.push(`<div class="preview-code"><div class="preview-code-header"><span>${escapeHtml(codeLanguage)}</span><button type="button" class="preview-code-copy" data-code-copy>复制</button></div><pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`);
    codeLines = [];
    codeLanguage = "";
    inCode = false;
  };
  const normalizedTitle = text(title).replace(/\s+/gu, " ").trim();
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const titleHeading = /^#\s+(.+)$/u.exec(lines[index]);
    if (titleHeading && text(titleHeading[1]).replace(/\s+/gu, " ").trim() === normalizedTitle) lines.splice(index, 1);
  }
  if (normalizedTitle) output.push(`<h1>${escapeHtml(title)}</h1>`);
  lines.forEach((line) => {
    const fence = /^```([^\s]*)\s*$/u.exec(line);
    if (fence) {
      if (inCode) closeCode();
      else { closeList(); inCode = true; codeLanguage = fence[1] || ""; }
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    const heading = /^(#{1,3})\s+(.+)$/u.exec(line);
    const list = /^\s*([-*+] |\d+\. )(.+)$/u.exec(line);
    if (heading) { closeList(); output.push(`<h${heading[1].length}>${markdownInline(heading[2])}</h${heading[1].length}>`); return; }
    if (/^\s*([-*_])\1\1+\s*$/u.test(line)) { closeList(); output.push("<hr>"); return; }
    if (line.startsWith("> ")) { closeList(); output.push(`<blockquote>${markdownInline(line.slice(2))}</blockquote>`); return; }
    if (list) {
      const nextType = /^\d+\./u.test(list[1]) ? "ol" : "ul";
      if (nextType !== listType) { closeList(); listType = nextType; output.push(`<${listType}>`); }
      output.push(`<li>${markdownInline(list[2])}</li>`);
      return;
    }
    closeList();
    if (line.trim()) output.push(`<p>${markdownInline(line)}</p>`);
  });
  closeCode();
  closeList();
  return output.join("") || '<p class="empty">这篇 Article 没有可预览的 Markdown 内容。</p>';
}

function renderPostBody(markdown) {
  const body = text(markdown).trim();
  return body ? `<p>${markdownInline(body)}</p>` : '<p class="empty">这条 Post 没有可预览的正文。</p>';
}

function renderBlocks(blocks, title = "") {
  const normalizedTitle = text(title).replace(/\s+/gu, " ").trim();
  const output = normalizedTitle ? [`<h1>${escapeHtml(title)}</h1>`] : [];
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (block.type === "image") {
      const source = block.imageId ? `data-local-image="${escapeHtml(block.imageId)}"` : `src="${escapeHtml(block.url || "")}"`;
      output.push(`<figure><img ${source} alt="${escapeHtml(block.altText || "")}" /></figure>`);
    } else if (block.type === "heading") {
      const level = Math.min(3, Math.max(1, Number(block.level) || 2));
      if (level === 1 && text(block.text).replace(/\s+/gu, " ").trim() === normalizedTitle) continue;
      output.push(`<h${level}>${markdownInline(block.text)}</h${level}>`);
    } else if (block.type === "blockquote") output.push(`<blockquote>${markdownInline(block.text)}</blockquote>`);
    else if (block.type === "divider") output.push("<hr>");
    else if (block.type === "code") output.push(`<div class="preview-code"><pre><code>${escapeHtml(block.text)}</code></pre></div>`);
    else if (block.text) output.push(`<p>${markdownInline(block.text)}</p>`);
  }
  return output.join("") || renderMarkdown(preview?.markdown || "", title);
}

async function hydrateLocalImages() {
  const nodes = [...article.querySelectorAll("img[data-local-image]")];
  await Promise.all(nodes.map(async (node) => {
    const image = await globalThis.XClipperContentDatabase.readImage(node.dataset.localImage);
    if (!image?.blob || !node.isConnected) return;
    const url = URL.createObjectURL(image.blob);
    node.src = url;
    node.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  }));
}

function renderPreview(value) {
  preview = value;
  previewTitle.textContent = previewMode === "content" ? "本地阅读" : "Markdown 预览";
  previewSubtitle.textContent = previewMode === "content" ? "已保存于此设备" : value.canSave ? "检查后可保存为素材" : "仅在此设备临时展示";
  const sourceUrl = /^https:\/\/(?:www\.)?(?:x|twitter)\.com\//u.test(value.sourceUrl || "") ? value.sourceUrl : "";
  const sourceLink = sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">打开 X 原文</a>` : "";
  const isPost = value.contentType === "post";
  const renderedContent = value.blocks?.length
    ? renderBlocks(value.blocks, isPost ? "" : value.title)
    : isPost ? renderPostBody(value.markdown) : renderMarkdown(value.markdown, value.title);
  article.classList.add("is-markdown");
  article.innerHTML = `<div class="preview-info"><span>${isPost ? "Post" : "Article"} 阅读视图</span>${metadata(value)}${sourceLink}</div>${renderedContent}${value.mediaNotice === "video" ? '<p class="preview-media-notice">含视频，仅原文可播放</p>' : ""}`;
  copyButton.disabled = false;
  saveButton.hidden = !(value.canSave || (previewMode === "content" && value.materialState === "none"));
  const saveLabel = saveButton.querySelector?.("span");
  if (saveLabel) saveLabel.textContent = "保存为素材";
  document.title = `${isPost ? value.authorName || value.authorHandle || "Post" : value.title || "Article"} · 预览`;
  hydrateLocalImages().catch(() => {});
}

async function loadPreview() {
  try {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    previewMode = mode || "";
    if (mode === "content") {
      const itemId = params.get("itemId") || "";
      if (!itemId) throw new Error("阅读链接无效，请返回待读列表重新打开。");
      const item = await globalThis.XClipperContentDatabase.getItem(itemId);
      if (!item) throw new Error("内容不存在或已被删除，请返回待读列表重新打开。");
      const openedAt = new Date().toISOString();
      await chrome.runtime.sendMessage({ type: "update-content-item", itemId, patch: { readState: "read", openedAt } });
      renderPreview({ ...item, canSave: false });
      return;
    }
    if (mode === "library") {
      const assetId = params.get("assetId") || "";
      if (!assetId) throw new Error("预览链接无效，请返回素材库重新打开。");
      const stored = await chrome.storage.local.get(CONTENT_INBOX_STORAGE_KEY);
      const inbox = stored[CONTENT_INBOX_STORAGE_KEY];
      const asset = inbox?.schemaVersion === 1 && Array.isArray(inbox.assets)
        ? inbox.assets.find((item) => item.id === assetId)
        : null;
      if (!asset) throw new Error("素材不存在或已被删除，请返回素材库重新打开。");
      renderPreview({ ...asset, canSave: false });
      return;
    }
    const previewId = params.get("previewId") || "";
    if (mode !== "current" || !/^[0-9a-f-]{36}$/iu.test(previewId)) {
      throw new Error("预览链接无效，请返回 X 重新打开。");
    }
    temporaryPreviewKey = `${MARKDOWN_PREVIEW_STORAGE_PREFIX}${previewId}`;
    const result = await chrome.storage.session.get(temporaryPreviewKey);
    if (!result[temporaryPreviewKey]) throw new Error("预览已过期，请返回 X 重新打开。");
    renderPreview(result[temporaryPreviewKey]);
  } catch (error) {
    preview = null;
    copyButton.disabled = true;
    saveButton.hidden = true;
    article.innerHTML = `<p class="empty">${escapeHtml(error.message || "无法打开预览。")}</p>`;
    status.textContent = "预览不可用";
  }
}

copyButton.addEventListener("click", async () => {
  if (!preview?.markdown) return;
  try {
    await navigator.clipboard.writeText(preview.markdown);
    copyButton.setAttribute("aria-label", "Markdown 已复制");
    copyButton.title = "Markdown 已复制";
    status.textContent = "Markdown 已复制（不含图片）";
  } catch {
    status.textContent = "复制失败，请检查剪贴板权限。";
  }
});

saveButton.addEventListener("click", async () => {
  if (!preview?.canSave && previewMode !== "content") return;
  saveButton.disabled = true;
  try {
    const result = previewMode === "content"
      ? await chrome.runtime.sendMessage({ type: "update-content-item", itemId: preview.id, patch: { materialState: "unused" } })
      : await chrome.runtime.sendMessage({ type: "save-article-asset", capture: { ...preview, content: preview.markdown, contentType: "article" } });
    if (result?.error) throw new Error(result.error);
    preview.canSave = false;
    preview.materialState = previewMode === "content" ? "unused" : preview.materialState;
    saveButton.hidden = true;
    if (temporaryPreviewKey) await chrome.storage.session.set({ [temporaryPreviewKey]: preview });
    status.textContent = "已保存为素材";
  } catch (error) {
    status.textContent = error.message || "保存失败";
    saveButton.disabled = false;
  }
});

document.querySelector("#close").addEventListener("click", async () => {
  if (temporaryPreviewKey) await chrome.storage.session.remove(temporaryPreviewKey);
  window.close();
});
article.addEventListener("click", async (event) => {
  const button = event.target.closest?.("[data-code-copy]");
  if (!button) return;
  const code = button.closest(".preview-code")?.querySelector("code")?.textContent || "";
  try {
    await navigator.clipboard.writeText(code);
    button.textContent = "已复制";
    status.textContent = "代码已复制";
  } catch {
    status.textContent = "复制失败，请检查剪贴板权限。";
  }
});

loadPreview();
