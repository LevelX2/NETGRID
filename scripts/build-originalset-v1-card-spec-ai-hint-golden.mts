import { cardSpecPlanningCards } from "../packages/cards/src/planning/index";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

import { deriveCardSpecAiHint } from "../packages/ai/src/card-spec-ai-hint-compiler";

const root = fileURLToPath(new URL("..", import.meta.url));
const reportPath = path.join(
  root,
  "docs/reviews/cards/originalset-v1-card-spec-migration-report.json",
);
const outputPath = path.join(
  root,
  "packages/ai/src/test-fixtures/originalset-v1-card-spec-ai-hints-reviewed-v1.json",
);
const mode = process.argv.includes("--write") ? "write" : "check";
const reportSource = await readFile(reportPath);
const report = JSON.parse(reportSource.toString("utf8")) as {
  aggregateOutputFingerprint?: string;
  idPartition?: { generatedCardSpecIds?: string[] };
};
const reviewedIds = report.idPartition?.generatedCardSpecIds;

if (
  report.aggregateOutputFingerprint === undefined ||
  reviewedIds === undefined ||
  reviewedIds.length !== 367 ||
  new Set(reviewedIds).size !== 367
)
  throw new Error("originalset_v1_ai_hint_golden_report_partition_mismatch");

const cards = cardSpecPlanningCards()
  .filter((entry) => reviewedIds.includes(entry.definition.id))
  .map((entry) => ({
    cardId: entry.definition.id,
    hint: deriveCardSpecAiHint(entry),
  }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId));

if (cards.length !== 367)
  throw new Error(
    `originalset_v1_ai_hint_golden_card_partition_mismatch:${cards.length}`,
  );

const golden = {
  schemaVersion: "originalset-v1-card-spec-ai-hint-reviewed-golden-v1",
  migrationReportFingerprint: report.aggregateOutputFingerprint,
  migrationReportSha256: `sha256:${createHash("sha256")
    .update(reportSource)
    .digest("hex")}`,
  dispositions: {
    mechanicalFacts:
      "derived_only_from_closed_typed_originalset_v1_card_spec_engine_nodes",
    planningClassifications:
      "derived_only_from_closed_typed_card_and_capability_annotations",
    scenarioAndQuality:
      "regenerated_from_current_ai_supported_scenario_evidence",
    legacyEditorialNotes: "discarded_nonruntime_manual_notes",
  },
  cards,
};
const serialized = await format(JSON.stringify(golden), {
  parser: "json",
  endOfLine: "lf",
});

if (mode === "write") {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}.`);
} else {
  const current = await readFile(outputPath, "utf8");
  if (current !== serialized)
    throw new Error(
      "originalset_v1_card_spec_ai_hint_golden_drift:run_with_--write_after_review",
    );
  console.log(`Originalset V1 CardSpec AI hint golden current: ${cards.length} cards.`);
}
