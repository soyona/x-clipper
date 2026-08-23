import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const stableDownloadUrl =
  "https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip";

test("active install docs use the stable latest-release asset", () => {
  for (const relativePath of ["README.md", "README.zh-CN.md"]) {
    const text = readFileSync(relativePath, "utf8");
    assert.ok(text.includes(stableDownloadUrl), `${relativePath} must use the stable download URL`);
  }

  for (const relativePath of ["README.md", "README.zh-CN.md", "release/INSTALL.md"]) {
    const text = readFileSync(relativePath, "utf8");
    assert.doesNotMatch(text, /releases\/download\/v\d+\.\d+\.\d+\//);
    assert.doesNotMatch(text, /x-article-clipper-v\d+\.\d+\.\d+(?:\.zip)?/);
  }
});

test("release contract check passes for the current version", () => {
  const result = spawnSync(process.execPath, ["scripts/release-contract.mjs", "check"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /version \d+\.\d+\.\d+ is consistent/);
});

test("package and manifest versions remain synchronized", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  assert.equal(packageJson.version, manifest.version);
});
