import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

function postSnapshot() {
  const context = { URL, globalThis: null };
  context.globalThis = context;
  runInNewContext(readFileSync(new URL("../post-snapshot.js", import.meta.url), "utf8"), context);
  return context.XClipperPostSnapshot;
}

function element({ text = "", quoted = false, href = "", src = "", alt = "" } = {}) {
  return {
    textContent: text,
    currentSrc: src,
    src,
    alt,
    closest(selector) {
      if (selector === '[role="link"]') return quoted ? { role: "link" } : null;
      if (selector.includes('/status/') && selector.includes('/photo/')) {
        return href ? { getAttribute: (name) => name === "href" ? href : "" } : null;
      }
      return null;
    },
  };
}

function root({ texts = [], images = [], videos = [] } = {}) {
  return {
    querySelectorAll(selector) {
      if (selector === '[data-testid="tweetText"]') return texts;
      if (selector === '[data-testid="tweetPhoto"] img') return images;
      if (selector.includes("previewInterstitial") || selector.includes("playButton")) return videos;
      return [];
    },
  };
}

function candidate(overrides = {}) {
  return {
    contentType: "post",
    sourceUrl: "https://x.com/runes_leo/status/2090442625820356780",
    title: "Current author text",
    authorHandle: "runes_leo",
    ...overrides,
  };
}

test("Post 快照只选择不在引用 role=link 内的当前作者正文", () => {
  const snapshot = postSnapshot();
  const current = element({ text: "Current author text" });
  const quoted = element({ text: "Quoted Post text", quoted: true });
  const selected = snapshot.currentAuthorTextElement(root({ texts: [current, quoted] }));

  assert.equal(selected, current);
});

test("Post 图片按当前 status ID 所有权过滤头像和引用图片", () => {
  const snapshot = postSnapshot();
  const avatar = element({ src: "https://pbs.twimg.com/profile_images/avatar.jpg" });
  const currentOne = element({
    href: "/runes_leo/status/2090442625820356780/photo/1",
    src: "https://pbs.twimg.com/media/current-1?name=medium",
  });
  const currentTwo = element({
    href: "/runes_leo/status/2090442625820356780/photo/2",
    src: "https://pbs.twimg.com/media/current-2?name=medium",
  });
  const quoted = element({
    href: "/runes_leo/status/2082347684212744486/photo/1",
    src: "https://pbs.twimg.com/media/quoted?name=medium",
  });

  const selected = snapshot.currentPostImages(
    root({ images: [avatar, currentOne, currentTwo, quoted] }),
    "https://x.com/runes_leo/status/2090442625820356780",
  );
  assert.deepEqual(Array.from(selected, (image) => image.src), [currentOne.src, currentTwo.src]);
});

test("视频证据只记录当前 Post，不采集引用 Post 视频", () => {
  const snapshot = postSnapshot();
  assert.equal(snapshot.containsCurrentPostVideo(root({ videos: [element()] })), true);
  assert.equal(snapshot.containsCurrentPostVideo(root({ videos: [element({ quoted: true })] })), false);
});

test("快照保留展开后的完整正文、当前图片和视频提示", () => {
  const snapshot = postSnapshot();
  const longText = "Expanded Post ".repeat(120).trim();
  const currentImage = element({
    href: "/runes_leo/status/2090442625820356780/photo/1",
    src: "https://pbs.twimg.com/media/current?format=jpg&name=medium",
    alt: "Image",
  });
  const result = snapshot.createSnapshot(root({
    texts: [element({ text: longText }), element({ text: "Quoted", quoted: true })],
    images: [currentImage],
    videos: [element()],
  }), candidate(), {
    paragraphFromElement: (node) => ({ type: "paragraph", text: node.textContent }),
    originalImageUrl: (value) => value.replace("name=medium", "name=orig"),
    markdownFromBlocks: (blocks) => blocks.map((block) => block.text || block.url).join("\n\n"),
  });

  assert.equal(result.version, 2);
  assert.equal(result.plainText, longText);
  assert.equal(result.blocks.length, 2);
  assert.equal(result.blocks[1].url.endsWith("name=orig"), true);
  assert.equal(result.markdown.includes("Quoted"), false);
  assert.equal(result.mediaNotice, "video");
});

test("首批不猜测音频 DOM，未知非图片媒体不产生 audio 状态", () => {
  const snapshot = postSnapshot();
  assert.doesNotMatch(snapshot.VIDEO_EVIDENCE_SELECTOR, /audio|space/u);
  const result = snapshot.createSnapshot(root({ texts: [element({ text: "Audio-like unknown media" })] }), candidate());
  assert.equal(result.mediaNotice, "none");
});
