#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const ACTIVE_HINTS_PATH = path.join(
  REPO_ROOT,
  "data/ai/ai-card-hints-active.json",
);
const REVIEWED_CARD_IDS = new Set([
  "corp_identity_001",
  "efficient_fracter",
  "onr_proteus_079_big-frackin-gun",
  "onr_proteus_081_boring-bit",
  "onr_proteus_083_corrosion",
  "onr_proteus_087_forwards-legacy",
  "onr_proteus_093_redecorator",
  "onr_proteus_095_skeleton-passkeys",
  "onr_proteus_100_wrecking-ball",
  "onr_v1_002_ai-boon",
  "onr_v1_007_blink",
  "onr_v1_015_codeslinger",
  "onr_v1_018_dogcatcher",
  "onr_v1_020_dupre",
  "onr_v1_023_evil-twin",
  "onr_v1_027_flak",
  "onr_v1_030_grubb",
  "onr_v1_031_hammer",
  "onr_v1_036_jackhammer",
  "onr_v1_053_ramming-piston",
  "onr_v1_055_reflector",
  "onr_v1_070_tinweasel",
  "onr_v1_083_desperate-competitor",
  "onr_v1_090_hot-tip-for-wns",
  "runner_identity_001",
  "simple_decoder",
  "simple_draw_event",
  "simple_economy_event",
  "simple_fracter",
  "simple_killer",
  "simple_run_event",
  "simple_setup_hardware",
  "v08_adaptive_killer",
  "v08_burst_credit_event",
  "v08_deep_draw_event",
  "v08_memory_chip",
  "v08_overclock_run_event",
  "v08_precise_decoder",
  "v08_steady_fracter"
]);

function parseMode(argv) {
  if (argv.length !== 1 || !["--check", "--write"].includes(argv[0])) {
    throw new Error("Use --check or --write.");
  }
  return argv[0].slice(2);
}

function formatQuality(quality, newline) {
  const entries = Object.entries(quality);
  return [
    "{",
    ...entries.map(
      ([key, value], index) =>
        `        ${JSON.stringify(key)}: ${JSON.stringify(value)}${
          index < entries.length - 1 ? "," : ""
        }`,
    ),
    "      }",
  ].join(newline);
}

function reviewedQuality(card) {
  if (!REVIEWED_CARD_IDS.has(card.cardId)) return card.quality;
  return {
    benchmarkCovered: false,
    strategyCovered: false,
    ...card.quality,
    hintReviewed: true,
    confidence: "medium",
    needsHumanReview: false,
    reviewedDate: "2026-07-18",
    reviewedBy: "codex",
  };
}

const mode = parseMode(process.argv.slice(2));
const original = fs.readFileSync(ACTIVE_HINTS_PATH, "utf8");
const data = JSON.parse(original);
const cardsById = new Map((data.cards ?? []).map((card) => [card.cardId, card]));
const cardsWithQuality = (data.cards ?? []).filter(
  (card) => card.quality !== undefined,
);
const expectedReviewedIds = new Set(
  (data.cards ?? [])
    .filter((card) => REVIEWED_CARD_IDS.has(card.cardId))
    .map((card) => card.cardId),
);
const unknownIds = [...REVIEWED_CARD_IDS].filter(
  (cardId) => !expectedReviewedIds.has(cardId),
);
if (unknownIds.length > 0) {
  throw new Error(`Unknown reviewed card ids: ${unknownIds.join(", ")}`);
}
const normalizedQuality = cardsWithQuality.map(reviewedQuality);
const newline = original.includes("\r\n") ? "\r\n" : "\n";
let qualityIndex = 0;
let normalized = original.replace(
  /      "quality": \{\r?\n(?:        [^\r\n]+\r?\n)*?      \}/g,
  () => {
    const quality = normalizedQuality[qualityIndex];
    qualityIndex += 1;
    return `      "quality": ${formatQuality(quality, newline)}`;
  },
);
if (qualityIndex !== normalizedQuality.length) {
  throw new Error(
    `Expected ${normalizedQuality.length} quality blocks, normalized ${qualityIndex}.`,
  );
}
const insertions = [];
for (const cardId of REVIEWED_CARD_IDS) {
  const card = cardsById.get(cardId);
  if (card?.quality !== undefined) continue;
  const marker = `      "cardId": ${JSON.stringify(cardId)}`;
  const cardStart = normalized.indexOf(marker);
  const nextCardStart = normalized.indexOf(
    `${newline}    {${newline}      "cardId":`,
    cardStart + 1,
  );
  const cardEnd = nextCardStart >= 0 ? nextCardStart : normalized.length;
  const statusMarker = `${newline}      "aiSupportStatus":`;
  const statusIndex = normalized.indexOf(statusMarker, cardStart);
  if (statusIndex < 0 || statusIndex >= cardEnd) {
    throw new Error(`Could not place quality for ${cardId}.`);
  }
  const formatted =
    `${newline}      "quality": ${formatQuality(reviewedQuality(card), newline)},`;
  insertions.push({ index: statusIndex, formatted });
}
for (const insertion of insertions.sort((left, right) => right.index - left.index)) {
  normalized = `${normalized.slice(0, insertion.index)}${insertion.formatted}${normalized.slice(insertion.index)}`;
}

if (mode === "write") {
  fs.writeFileSync(ACTIVE_HINTS_PATH, normalized, "utf8");
} else if (normalized !== original) {
  console.error("AI hint review closeout is stale.");
  process.exitCode = 1;
}
console.log(
  JSON.stringify({ status: "pass", mode, reviewedCards: REVIEWED_CARD_IDS.size }),
);
