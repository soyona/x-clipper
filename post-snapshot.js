(function registerPostSnapshot() {
  const TWEET_TEXT_SELECTOR = '[data-testid="tweetText"]';
  const PHOTO_IMAGE_SELECTOR = '[data-testid="tweetPhoto"] img';
  const VIDEO_EVIDENCE_SELECTOR = [
    '[data-testid="previewInterstitial"][aria-label="Embedded video"]',
    '[data-testid="playButton"][aria-label="Play this video"]',
  ].join(", ");

  function statusIdFromUrl(value) {
    const directMatch = /\/status\/(\d+)(?:$|[/?#])/u.exec(String(value || ""));
    if (directMatch) return directMatch[1];
    try {
      return /\/status\/(\d+)(?:$|[/?#])/u.exec(new URL(value).pathname)?.[1] || "";
    } catch {
      return "";
    }
  }

  function belongsToQuotedPost(element) {
    return Boolean(element?.closest?.('[role="link"]'));
  }

  function currentAuthorTextElement(root) {
    return [...root?.querySelectorAll?.(TWEET_TEXT_SELECTOR) || []]
      .find((element) => !belongsToQuotedPost(element)) || null;
  }

  function photoOwnerStatusId(image) {
    const link = image?.closest?.('a[href*="/status/"][href*="/photo/"]');
    return statusIdFromUrl(link?.getAttribute?.("href") || "");
  }

  function currentPostImages(root, sourceUrl) {
    const sourceStatusId = statusIdFromUrl(sourceUrl);
    if (!sourceStatusId) return [];
    return [...root?.querySelectorAll?.(PHOTO_IMAGE_SELECTOR) || []]
      .filter((image) => photoOwnerStatusId(image) === sourceStatusId);
  }

  function containsCurrentPostVideo(root) {
    return [...root?.querySelectorAll?.(VIDEO_EVIDENCE_SELECTOR) || []]
      .some((element) => !belongsToQuotedPost(element));
  }

  function createSnapshot(root, candidate, helpers = {}) {
    if (candidate?.contentType !== "post" || !statusIdFromUrl(candidate?.sourceUrl)) {
      throw new Error("只能为有效的 X Post 创建快照。");
    }
    const textElement = currentAuthorTextElement(root);
    const paragraph = textElement
      ? helpers.paragraphFromElement?.(textElement) || { type: "paragraph", text: String(textElement.textContent || "").trim() }
      : null;
    if (!paragraph?.text) throw new Error("没有找到当前作者的 Post 正文。");
    const imageBlocks = currentPostImages(root, candidate.sourceUrl).map((image) => ({
      type: "image",
      url: helpers.originalImageUrl?.(image.currentSrc || image.src || "") || image.currentSrc || image.src || "",
      altText: image.alt || "",
    })).filter((block) => block.url);
    const blocks = [paragraph, ...imageBlocks];
    const markdown = helpers.markdownFromBlocks?.(blocks)
      || blocks.map((block) => block.type === "image" ? `![${block.altText || "图片"}](${block.url})` : block.text).join("\n\n");
    return {
      ...candidate,
      kind: "x-clipper.capture",
      version: 2,
      blocks,
      content: markdown,
      markdown,
      plainText: paragraph.text,
      mediaNotice: containsCurrentPostVideo(root) ? "video" : "none",
    };
  }

  globalThis.XClipperPostSnapshot = {
    PHOTO_IMAGE_SELECTOR,
    TWEET_TEXT_SELECTOR,
    VIDEO_EVIDENCE_SELECTOR,
    belongsToQuotedPost,
    containsCurrentPostVideo,
    createSnapshot,
    currentAuthorTextElement,
    currentPostImages,
    photoOwnerStatusId,
    statusIdFromUrl,
  };
}());
