import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const content = readFileSync(new URL("../content.js", import.meta.url), "utf8");

function frozenRegion(startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing frozen X DOM marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing frozen X DOM marker: ${endMarker}`);
  return content.slice(start, end).replace(/\r\n/gu, "\n");
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

const FROZEN_X_DOM_REGIONS = [
  {
    name: "page ownership and Article/Post candidates",
    start: "function isArticleSourcePage",
    end: "function normalizedSourceUrl",
    sha256: "e361e30a0912d39e5b8b44eb792865ed9db7f7daa72434567d10984a2b9991f4",
  },
  {
    name: "entry ownership and cleanup",
    start: "function articleActionsContextFromMoreButton",
    end: "function removeInvalidArticleActionsSlots",
    sha256: "6cbf3be13a324f66ef03b54044afeb192fe20c70b790a46793e0882698691ff6",
  },
  {
    name: "entry slot injection geometry",
    start: "function injectArticleActionsEntry",
    end: "function flushArticleActionsEntries",
    sha256: "523d51317fa74afaa15dffce22dddf75d16b3889184b23d8a9eac0d54f6cee53",
  },
  {
    name: "target preparation and content capture",
    start: "async function prepareTargetContent",
    end: "function currentPageContext",
    sha256: "6552148d169a5b3348e616dda0f714e1ffdd875fc8073b5c2a2252a34202e7a7",
  },
];

test("已取证的 X DOM 解析、所有权、入口几何与采集逻辑保持冻结", () => {
  for (const region of FROZEN_X_DOM_REGIONS) {
    assert.equal(
      digest(frozenRegion(region.start, region.end)),
      region.sha256,
      `${region.name} changed without a new user-supplied X DOM evidence review`,
    );
  }
});
