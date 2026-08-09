import fs from "node:fs";
import path from "node:path";
import { CARD_DEFINITIONS_BY_ID } from "../packages/engine/src/index.ts";

const root = process.cwd();
const cards = Object.values(CARD_DEFINITIONS_BY_ID).filter(
  (card) => card.type === "program" && card.subtypes?.includes("icebreaker"),
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
if (cards.length !== 54)
  failures.push(
    `effektiver Icebreaker-Pool hat ${cards.length} statt 54 Karten`,
  );
for (const cardId of [
  "onr_proteus_080_black-widow",
  "onr_proteus_092_morphing-tool",
])
  if (!cards.some((card) => card.id === cardId))
    failures.push(`effektiver Icebreaker-Pool vermisst ${cardId}`);
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

function readSource(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}
