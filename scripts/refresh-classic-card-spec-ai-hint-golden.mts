import { cardSpecPlanningCards } from "../packages/cards/src/planning/index";
import { deriveCardSpecAiHint } from "../packages/ai/src/card-spec-ai-hint-compiler";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const root = fileURLToPath(new URL("..", import.meta.url));
const reportPath = new URL(
  "../docs/reviews/cards/classic-card-spec-migration-report.json",
  import.meta.url,
);
const fixturePath = new URL(
  "../packages/ai/src/test-fixtures/classic-card-spec-ai-hints-reviewed-v1.json",
  import.meta.url,
);
const reportSource = await readFile(reportPath);
const report = JSON.parse(reportSource.toString("utf8")) as {
  aggregateOutputFingerprint: string;
  cards: Array<{ cardDefinitionId: string }>;
};
const existing = JSON.parse(await readFile(fixturePath, "utf8")) as object;
const ids = new Set(report.cards.map((card) => card.cardDefinitionId));
const cards = cardSpecPlanningCards()
  .filter((entry) => ids.has(entry.definition.id))
  .map((entry) => ({ cardId: entry.definition.id, hint: deriveCardSpecAiHint(entry) }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId));
if (cards.length !== 54) throw new Error(`classic_ai_hint_golden_partition:${cards.length}`);
const output = {
  ...existing,
  migrationReportFingerprint: report.aggregateOutputFingerprint,
  migrationReportSha256: `sha256:${createHash("sha256").update(reportSource).digest("hex")}`,
  cards,
};
await writeFile(
  fixturePath,
  await format(JSON.stringify(output), { parser: "json", endOfLine: "lf" }),
  "utf8",
);
console.log(`Wrote ${new URL(fixturePath).pathname.replace(root, "")}`);
