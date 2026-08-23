#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stableAssetName = "x-article-clipper.zip";
const stableRootName = "x-article-clipper";
const stableDownloadUrl =
  "https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip";

const runtimeEntries = [
  "manifest.json",
  "background.js",
  "content.js",
  "content-db.js",
  "content-store.js",
  "post-snapshot.js",
  "markdown.js",
  "i18n.js",
  "sidepanel.html",
  "sidepanel.css",
  "sidepanel.js",
  "sidepanel-sort.js",
  "preview.html",
  "preview.css",
  "preview.js",
  "popup.html",
  "popup.js",
  "LICENSE",
  "PRIVACY.md",
  "PRIVACY.zh-CN.md",
  "assets/icons",
];

function fail(message) {
  throw new Error(`[release-contract] ${message}`);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function requestedTag() {
  const index = process.argv.indexOf("--tag");
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value) fail("--tag requires a value such as v1.2.3");
  return value;
}

function checkReleaseContract() {
  const manifest = readJson("manifest.json");
  const packageJson = readJson("package.json");

  if (manifest.version !== packageJson.version) {
    fail(
      `manifest version ${manifest.version} does not match package version ${packageJson.version}`,
    );
  }

  const tag = requestedTag();
  if (tag && tag !== `v${manifest.version}`) {
    fail(`tag ${tag} does not match manifest version v${manifest.version}`);
  }

  for (const relativePath of ["README.md", "README.zh-CN.md"]) {
    const text = readFileSync(path.join(repoRoot, relativePath), "utf8");
    if (!text.includes(stableDownloadUrl)) {
      fail(`${relativePath} must link to ${stableDownloadUrl}`);
    }
  }

  for (const relativePath of ["README.md", "README.zh-CN.md", "release/INSTALL.md"]) {
    const text = readFileSync(path.join(repoRoot, relativePath), "utf8");
    if (/releases\/download\/v\d+\.\d+\.\d+\//.test(text)) {
      fail(`${relativePath} contains a version-specific release download URL`);
    }
    if (/x-article-clipper-v\d+\.\d+\.\d+(?:\.zip)?/.test(text)) {
      fail(`${relativePath} contains a version-specific package or folder name`);
    }
  }

  for (const relativePath of runtimeEntries) {
    if (!existsSync(path.join(repoRoot, relativePath))) {
      fail(`required runtime entry is missing: ${relativePath}`);
    }
  }

  console.log(`[release-contract] version ${manifest.version} is consistent`);
  return manifest.version;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "unknown error").trim();
    fail(`${command} failed: ${detail}`);
  }
  return result.stdout;
}

function packageRelease() {
  const version = checkReleaseContract();
  const tempDirectory = mkdtempSync(path.join(tmpdir(), "x-clipper-release-"));
  const packageRoot = path.join(tempDirectory, stableRootName);
  const outputPath = path.join(repoRoot, "release", stableAssetName);

  try {
    mkdirSync(packageRoot, { recursive: true });
    for (const relativePath of runtimeEntries) {
      const source = path.join(repoRoot, relativePath);
      const destination = path.join(packageRoot, relativePath);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(source, destination, { recursive: true });
    }
    cpSync(path.join(repoRoot, "release", "INSTALL.md"), path.join(packageRoot, "INSTALL.md"));

    rmSync(outputPath, { force: true });
    run("zip", ["-q", "-r", "-X", outputPath, stableRootName], { cwd: tempDirectory });

    const entries = run("unzip", ["-Z1", outputPath])
      .split("\n")
      .filter(Boolean);
    if (!entries.length || entries.some((entry) => !entry.startsWith(`${stableRootName}/`))) {
      fail(`archive entries must all live under ${stableRootName}/`);
    }
    if (!entries.includes(`${stableRootName}/manifest.json`)) {
      fail("archive does not contain the packaged manifest");
    }

    const packagedManifest = JSON.parse(
      run("unzip", ["-p", outputPath, `${stableRootName}/manifest.json`]),
    );
    if (packagedManifest.version !== version) {
      fail(`packaged manifest version ${packagedManifest.version} does not match ${version}`);
    }

    const digest = createHash("sha256").update(readFileSync(outputPath)).digest("hex");
    console.log(`[release-contract] created release/${stableAssetName}`);
    console.log(`[release-contract] sha256 ${digest}`);
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true });
  }
}

const command = process.argv[2] || "check";

try {
  if (command === "check") {
    checkReleaseContract();
  } else if (command === "package") {
    packageRelease();
  } else {
    fail(`unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
