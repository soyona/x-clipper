import { readFile, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const libraryUrl = new URL("assets/icons/x-clipper-ui-icons.svg", projectRoot);
const boardUrl = new URL("docs/design/x-clipper-ui-icon-spec.svg", projectRoot);
const markerStart = "  <!-- x-clipper-ui-symbols:start -->";
const markerEnd = "  <!-- x-clipper-ui-symbols:end -->";

const library = await readFile(libraryUrl, "utf8");
const symbols = library
  .replace(/^<svg[^>]*>\s*/u, "")
  .replace(/\s*<\/svg>\s*$/u, "")
  .trim()
  .split("\n")
  .map((line) => (line.trim() ? `    ${line.trimStart()}` : ""))
  .join("\n");
const definitions = `${markerStart}\n  <defs>\n${symbols}\n  </defs>\n${markerEnd}`;

let board = await readFile(boardUrl, "utf8");
if (board.includes(markerStart) && board.includes(markerEnd)) {
  const start = board.indexOf(markerStart);
  const end = board.indexOf(markerEnd, start) + markerEnd.length;
  board = `${board.slice(0, start)}${definitions}${board.slice(end)}`;
} else {
  board = board.replace("  </style>", `  </style>\n${definitions}`);
}
board = board.replaceAll("../../assets/icons/x-clipper-ui-icons.svg#", "#");

const symbolIds = new Set([...board.matchAll(/<symbol id="([^"]+)"/gu)].map((match) => match[1]));
const referencedIds = [...board.matchAll(/<use href="#([^"]+)"/gu)].map((match) => match[1]);
const missingIds = referencedIds.filter((id) => !symbolIds.has(id));
if (!referencedIds.length || missingIds.length) {
  throw new Error(`Invalid icon references: ${missingIds.join(", ") || "none found"}`);
}
if (/<use href="(?!#)/u.test(board)) throw new Error("External icon references remain in the icon board.");

await writeFile(boardUrl, board);
