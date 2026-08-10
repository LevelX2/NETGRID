import { cardSpecPlanningCards } from "@netgrid/cards/planning";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import migrationReport from "../../../docs/reviews/cards/originalset-v1-card-spec-migration-report.json";
import reviewedGolden from "./test-fixtures/originalset-v1-card-spec-ai-hints-reviewed-v1.json";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const reviewedIds = new Set(reviewedGolden.cards.map((record) => record.cardId));

describe("Originalset V1 CardSpec AI hint reviewed semantic golden", () => {
  it("binds the exact 367-card report partition and aggregate", () => {
    const reportPath = fileURLToPath(
      new URL(
        "../../../docs/reviews/cards/originalset-v1-card-spec-migration-report.json",
        import.meta.url,
      ),
    );
    expect(reviewedGolden.migrationReportFingerprint).toBe(
      migrationReport.aggregateOutputFingerprint,
    );
    expect(reviewedGolden.migrationReportSha256).toBe(
      `sha256:${createHash("sha256").update(readFileSync(reportPath)).digest("hex")}`,
    );
    expect(reviewedGolden.cards).toHaveLength(367);
    expect(reviewedIds.size).toBe(367);
  });

  it("pins complete compiler outputs, evidence, and typed action capacity", () => {
    const compiled = cardSpecPlanningCards()
      .filter((entry) => reviewedIds.has(entry.definition.id))
      .map((entry) => ({ cardId: entry.definition.id, hint: deriveCardSpecAiHint(entry) }))
      .sort((left, right) => left.cardId.localeCompare(right.cardId));
    expect(compiled).toEqual(reviewedGolden.cards);
    expect(
      generatedArtifact.cards
        .filter((record) => reviewedIds.has(record.cardId))
        .map(({ cardId, hint }) => ({ cardId, hint })),
    ).toEqual(reviewedGolden.cards);
    const actionCapacity = reviewedGolden.cards.flatMap((record) =>
      (record.hint.actionCapacityProfiles ?? []).map((profile) => ({
        cardId: record.cardId,
        profile,
      })),
    );
    expect(actionCapacity).toHaveLength(31);
    expect(new Set(actionCapacity.map(({ cardId }) => cardId)).size).toBe(30);
    for (const { hint } of reviewedGolden.cards) {
      expect(hint).not.toHaveProperty("manualNotes");
      expect(hint.scenarioRefs).toEqual([
        "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
      ]);
    }
  });
});
