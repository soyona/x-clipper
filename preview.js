const article = document.querySelector("#article");
const status = document.querySelector("#status");
const copyButton = document.querySelector("#copy");
const saveButton = document.querySelector("#save");
const previewTitle = document.querySelector("#preview-title");
const previewSubtitle = document.querySelector("#preview-subtitle");
const i18n = globalThis.XClipperI18n;
const t = (key, values) => i18n.t(key, values);
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
  return Number.isNaN(date.valueOf()) ? text(value) : new Intl.DateTimeFormat(i18n.getLocale(), { year: "numeric", month: "numeric", day: "numeric" }).format(date);
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
    output.push(`<div class="preview-code"><div class="preview-code-header"><span>${escapeHtml(codeLanguage)}</span><button type="button" class="preview-code-copy" data-code-copy>${escapeHtml(t("copy"))}</button></div><pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`);
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
  return output.join("") || `<p class="empty">${escapeHtml(t("articleEmpty"))}</p>`;
}

function renderPostBody(markdown) {
  const body = text(markdown).trim();
  return body ? `<p>${markdownInline(body)}</p>` : `<p class="empty">${escapeHtml(t("postEmpty"))}</p>`;
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
  previewTitle.textContent = previewMode === "content" ? t("localReading") : t("markdownPreview");
  previewSubtitle.textContent = previewMode === "content" ? t("savedOnDevice") : value.canSave ? t("reviewThenSave") : t("temporaryOnDevice");
  const sourceUrl = /^https:\/\/(?:www\.)?(?:x|twitter)\.com\//u.test(value.sourceUrl || "") ? value.sourceUrl : "";
  const sourceLink = sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t("openXOriginal"))}</a>` : "";
  const isPost = value.contentType === "post";
  const renderedContent = value.blocks?.length
    ? renderBlocks(value.blocks, isPost ? "" : value.title)
    : isPost ? renderPostBody(value.markdown) : renderMarkdown(value.markdown, value.title);
  article.classList.add("is-markdown");
  article.innerHTML = `<div class="preview-info"><span>${escapeHtml(t("readingView", { type: isPost ? "Post" : "Article" }))}</span>${metadata(value)}${sourceLink}</div>${renderedContent}${value.mediaNotice === "video" ? `<p class="preview-media-notice">${escapeHtml(t("videoOriginalOnly"))}</p>` : ""}`;
  copyButton.disabled = false;
  saveButton.hidden = !(value.canSave || (previewMode === "content" && value.materialState === "none"));
  const saveLabel = saveButton.querySelector?.("span");
  if (saveLabel) saveLabel.textContent = t("saveMaterial");
  document.title = `${isPost ? value.authorName || value.authorHandle || "Post" : value.title || "Article"} · ${t("previewDocumentTitle")}`;
  hydrateLocalImages().catch(() => {});
}

async function loadPreview() {
  try {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    previewMode = mode || "";
    if (mode === "content") {
      const itemId = params.get("itemId") || "";
      if (!itemId) throw new Error(t("invalidReadingLink"));
      const item = await globalThis.XClipperContentDatabase.getItem(itemId);
      if (!item) throw new Error(t("missingReadingItem"));
      const openedAt = new Date().toISOString();
      await chrome.runtime.sendMessage({ type: "update-content-item", itemId, patch: { readState: "read", openedAt } });
      renderPreview({ ...item, canSave: false });
      return;
    }
    if (mode === "library") {
      const assetId = params.get("assetId") || "";
      if (!assetId) throw new Error(t("invalidPreviewLink"));
      const stored = await chrome.storage.local.get(CONTENT_INBOX_STORAGE_KEY);
      const inbox = stored[CONTENT_INBOX_STORAGE_KEY];
      const asset = inbox?.schemaVersion === 1 && Array.isArray(inbox.assets)
        ? inbox.assets.find((item) => item.id === assetId)
        : null;
      if (!asset) throw new Error(t("missingMaterial"));
      renderPreview({ ...asset, canSave: false });
      return;
    }
    const previewId = params.get("previewId") || "";
    if (mode !== "current" || !/^[0-9a-f-]{36}$/iu.test(previewId)) {
      throw new Error(t("invalidXPreviewLink"));
    }
    temporaryPreviewKey = `${MARKDOWN_PREVIEW_STORAGE_PREFIX}${previewId}`;
    const result = await chrome.storage.session.get(temporaryPreviewKey);
    if (!result[temporaryPreviewKey]) throw new Error(t("expiredPreview"));
    renderPreview(result[temporaryPreviewKey]);
  } catch (error) {
    preview = null;
    copyButton.disabled = true;
    saveButton.hidden = true;
    article.innerHTML = `<p class="empty">${escapeHtml(i18n.localizeError(error.message, "previewOpenFailed"))}</p>`;
    status.textContent = t("previewUnavailable");
  }
}

copyButton.addEventListener("click", async () => {
  if (!preview?.markdown) return;
  try {
    await navigator.clipboard.writeText(preview.markdown);
    copyButton.setAttribute("aria-label", t("markdownCopied"));
    copyButton.title = t("markdownCopied");
    status.textContent = t("markdownCopiedNoImages");
  } catch {
    status.textContent = t("clipboardFailed");
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
    status.textContent = t("savedAsMaterial");
  } catch (error) {
    status.textContent = i18n.localizeError(error.message, "saveFailed");
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
    button.textContent = t("copied");
    status.textContent = t("codeCopied");
  } catch {
    status.textContent = t("clipboardFailed");
  }
});

i18n.subscribe(() => { if (preview) renderPreview(preview); });
i18n.init().then(loadPreview);
