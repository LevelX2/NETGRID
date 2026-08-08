import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cardFiles = [
  ["originalset-v1", "data/cards/originalset-v1-cards.json"],
  ["classic", "data/cards/classic-cards.json"],
  ["proteus", "data/cards/proteus-cards.json"],
];
const cards = cardFiles.flatMap(([sourceSet, file]) =>
  readJson(file)
    .cards.filter(
      (card) =>
        card.type === "program" && card.subtypes?.includes("icebreaker"),
    )
    .map((card) => ({ ...card, sourceSet })),
);
const activeRunPath = readSource(
  "packages/ai/src/run-analysis/visible-run-breaker-path.ts",
);
const forbiddenActiveRunFallbacks = [
  "textBreakSubroutineAbility",
  "textPumpStrengthAbility",
  "breakerProfile",
];
const failures = forbiddenActiveRunFallbacks
  .filter((symbol) => activeRunPath.includes(symbol))
  .map((symbol) => `aktiver Icebreaker-Run nutzt weiterhin ${symbol}`);
if (failures.length > 0) {
  console.error(
    `Icebreaker-Run-Semantik fehlgeschlagen:\n${failures.map((item) => `- ${item}`).join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Icebreaker-Run-Semantik: ${cards.length} aktive Breaker ohne Text- oder Hint-Fallback im Runpfad.`,
  );
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readSource(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
