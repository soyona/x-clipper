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
  return content.slice(start, end)
    .replace(/entry\.setAttribute\(("(?:aria-label|title)"),\s*(?:"[^"]*"|t\("actions"\))\);/gu, "entry.setAttribute($1, LOCALIZED_ACTIONS_LABEL);")
    .replace(/throw new Error\((?:t\("[A-Za-z0-9]+"\)|"[^"]*")\);/gu, "throw new Error(LOCALIZED_ERROR);")
    .replace(/\r\n/gu, "\n");
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
    sha256: "e503552c4d6e29d24d222d68abb019022853f081f4291ab51847ec7652a59ed5",
  },
  {
    name: "target preparation and content capture",
    start: "async function prepareTargetContent",
    end: "function currentPageContext",
    sha256: "b20d3a3150036432cf51d30aaf0aa02f96e4e21e167128d837a76cca2407d11b",
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
