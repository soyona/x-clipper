const button = document.querySelector("#import");
const status = document.querySelector("#status");
const i18n = globalThis.XClipperI18n;
const t = (key, values) => i18n.t(key, values);

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = kind;
}

async function copyMarkdown(capture) {
  await navigator.clipboard.writeText(
    globalThis.XClipperMarkdown.blocksToMarkdown(capture.blocks, { includeImages: false }),
  );
}

button.addEventListener("click", async () => {
  button.disabled = true;
  button.textContent = t("preparing");
  button.setAttribute("aria-busy", "true");
  setStatus(t("readingCurrentPage"));
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https:\/\/(?:www\.)?(?:x|twitter)\.com\//u.test(tab.url || "")) {
      throw new Error(t("openPostOrArticle"));
    }
    const capture = await chrome.tabs.sendMessage(tab.id, { type: "capture-x" });
    if (capture?.error) throw new Error(capture.error);
    if (!capture?.content) throw new Error(t("noContentFound"));
    await copyMarkdown(capture);
    setStatus(t("markdownCopiedPeriod"));
    window.close();
  } catch (error) {
    setStatus(i18n.localizeError(error.message, "pageReadFailed"), "error");
  } finally {
    button.disabled = false;
    button.textContent = t("extractAndCopy");
    button.removeAttribute("aria-busy");
  }
});

i18n.init();
