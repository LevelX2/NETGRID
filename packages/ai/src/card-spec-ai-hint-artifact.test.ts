import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  cardSpecPlanningCards,
  CS06_CARD_DEFINITION_IDS,
} from "@netgrid/cards/planning";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import scenarioPack from "../../../data/scenarios/card-support-ai-supported-current.json";
import classicReviewedGolden from "./test-fixtures/classic-card-spec-ai-hints-reviewed-v1.json";
import testsetReviewedGolden from "./test-fixtures/testset-card-spec-ai-hints-reviewed-v1.json";
import {
  buildCardSpecAiHintArtifact,
  serializeCardSpecAiHintArtifact,
} from "../../../scripts/lib/card-spec-ai-hint-artifact-builder";
import { validateGeneratedArtifact } from "./generated-ai-hint-artifact-validation";

describe("CardSpec generated AI hint artifact", () => {
  it("is the canonical exact-100 active output of the current compiler inputs", () => {
    const compiled = buildCardSpecAiHintArtifact();

    expect(compiled).toEqual(generatedArtifact);
    expect(compiled.cardIds).toHaveLength(100);
    expect(compiled.cardIds).not.toContain("catalog_preview_operation_001");
    expect(compiled.cardIds).not.toContain("catalog_preview_resource_001");
    expect(compiled.cardIds).toEqual([...compiled.cardIds].sort());
    expect(compiled.cards.map((entry) => entry.cardId)).toEqual(
      compiled.cardIds,
    );
    expect(serializeCardSpecAiHintArtifact(compiled)).toBe(
      `${JSON.stringify(generatedArtifact, null, 2)}\n`,
    );
  });

  it("changes for rules and planning-annotation fingerprint drift", () => {
    const entries = cardSpecPlanningCards();
    const first = entries[0]!;
    const rulesDrift = [
      {
        ...first,
        planning: {
          ...first.planning,
          cardRulesFingerprint: "fnv1a64x2:card-rules-v1:rules-drift",
        },
      },
      ...entries.slice(1),
    ];
    const planningDrift = [
      {
        ...first,
        planning: {
          ...first.planning,
          planningAnnotationsFingerprint:
            "fnv1a64x2:card-planning-annotations-v1:planning-drift",
        },
      },
      ...entries.slice(1),
    ];

    expect(buildCardSpecAiHintArtifact({ entries: rulesDrift })).not.toEqual(
      generatedArtifact,
    );
    expect(buildCardSpecAiHintArtifact({ entries: planningDrift })).not.toEqual(
      generatedArtifact,
    );
  });

  it("binds inputs to the independent exact active CardSpec id partition", () => {
    const entries = cardSpecPlanningCards();
    const partitions = [
      [...CS06_CARD_DEFINITION_IDS],
      testsetReviewedGolden.cards.map((record) => record.cardId),
      classicReviewedGolden.cards.map((record) => record.cardId),
    ];
    expect(partitions.map((partition) => partition.length)).toEqual([
      10, 36, 54,
    ]);
    const reviewedExpectedIds = partitions.flat().sort();
    expect(new Set(reviewedExpectedIds).size).toBe(100);
    expect(generatedArtifact.cardIds).toEqual(reviewedExpectedIds);
    expect(entries.map((entry) => entry.definition.id).sort()).toEqual(
      reviewedExpectedIds,
    );

    expect(() =>
      buildCardSpecAiHintArtifact({ entries: entries.slice(1) }),
    ).toThrow("card_spec_ai_hint_artifact_input_mismatch");

    const foreign = entries.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            definition: {
              ...entry.definition,
              id: "future_foreign_card_spec",
            },
          }
        : entry,
    );
    expect(() => buildCardSpecAiHintArtifact({ entries: foreign })).toThrow(
      "card_spec_ai_hint_artifact_input_mismatch",
    );

    const duplicate = [...entries];
    duplicate[0] = duplicate[1]!;
    expect(() => buildCardSpecAiHintArtifact({ entries: duplicate })).toThrow(
      "card_spec_ai_hint_artifact_input_mismatch",
    );

    expect(
      buildCardSpecAiHintArtifact({ entries: [...entries].reverse() }),
    ).toEqual(generatedArtifact);
  });

  it("fails closed for missing scenario evidence and fingerprints evidence drift", () => {
    const missingEvidence = structuredClone(scenarioPack);
    const supportScenario = missingEvidence.scenarios.find(
      (scenario) => scenario.id === "active_card_support_ai_supported",
    )!;
    supportScenario.coversCards = supportScenario.coversCards.filter(
      (cardId) => cardId !== generatedArtifact.cardIds[0],
    );
    expect(() =>
      buildCardSpecAiHintArtifact({ scenarioPack: missingEvidence }),
    ).toThrow("card_spec_ai_hint_artifact_missing_support");

    const evidenceDrift = structuredClone(scenarioPack);
    evidenceDrift.scenarios
      .find((scenario) => scenario.id === "active_card_support_ai_supported")!
      .coversCards.push("future_evidence_only_card");
    expect(
      buildCardSpecAiHintArtifact({ scenarioPack: evidenceDrift }).evidence
        .fingerprint,
    ).not.toBe(generatedArtifact.evidence.fingerprint);
  });

  it("keeps the runtime module disconnected from compiler and planning imports", () => {
    const runtimeSource = readFileSync(
      fileURLToPath(new URL("./catalog-ai-hint-authority.ts", import.meta.url)),
      "utf8",
    );

    expect(runtimeSource).not.toMatch(
      /from\s+["']\.\/(?:cs06|card-spec)-ai-hint-(?:compiler|artifact-builder)["']/,
    );
    expect(runtimeSource).not.toMatch(
      /from\s+["']@netgrid\/cards\/planning["']/,
    );
  });

  it("keeps the catalog subpath transitively isolated from AI and Cards registries", async () => {
    const result = await build({
      entryPoints: [
        fileURLToPath(new URL("./catalog-ai-hint-public.ts", import.meta.url)),
      ],
      bundle: true,
      format: "esm",
      metafile: true,
      platform: "node",
      treeShaking: true,
      write: false,
    });
    const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
    const inputs = Object.keys(result.metafile.inputs)
      .map((input) =>
        path
          .relative(
            repositoryRoot,
            path.isAbsolute(input) ? input : path.resolve(input),
          )
          .replaceAll("\\", "/"),
      )
      .sort();

    expect(inputs).toEqual(
      [
        "data/ai/ai-card-hints-active.json",
        "data/ai/card-spec-ai-hints-generated.json",
        "packages/ai/src/ai-hint-contracts.ts",
        "packages/ai/src/catalog-ai-hint-authority.ts",
        "packages/ai/src/catalog-ai-hint-public.ts",
        "packages/ai/src/generated-ai-hint-artifact-validation.ts",
      ].sort(),
    );
  });

  it("fails closed for malformed runtime evidence provenance", () => {
    for (const evidence of [
      { ...generatedArtifact.evidence, scenarioPackId: "other-pack" },
      { ...generatedArtifact.evidence, scenarioId: "other-scenario" },
      { ...generatedArtifact.evidence, fingerprint: "not-a-fingerprint" },
      { ...generatedArtifact.evidence, fingerprint: 1 },
    ])
      expect(() =>
        validateGeneratedArtifact({ ...generatedArtifact, evidence }),
      ).toThrow("invalid_card_spec_ai_hint_artifact_contract");
  });

  it("fails closed for duplicate, missing and malformed artifact rows", () => {
    const nullRow = {
      ...generatedArtifact,
      cards: generatedArtifact.cards.map((record, index) =>
        index === 0 ? null : record,
      ),
    };
    expect(() => validateGeneratedArtifact(nullRow)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    const missingHint = {
      ...generatedArtifact,
      cards: generatedArtifact.cards.map((record, index) =>
        index === 0
          ? {
              cardId: record.cardId,
              cardRulesFingerprint: record.cardRulesFingerprint,
              planningAnnotationsFingerprint:
                record.planningAnnotationsFingerprint,
            }
          : record,
      ),
    };
    expect(() => validateGeneratedArtifact(missingHint)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    const duplicateId = structuredClone(generatedArtifact);
    duplicateId.cardIds[0] = duplicateId.cardIds[1]!;
    expect(() => validateGeneratedArtifact(duplicateId)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    const missingRow = structuredClone(generatedArtifact);
    missingRow.cards.pop();
    expect(() => validateGeneratedArtifact(missingRow)).toThrow(
      "invalid_card_spec_ai_hint_artifact_contract",
    );

    const mismatchedHintId = structuredClone(generatedArtifact);
    mismatchedHintId.cards[0]!.hint.cardId = "foreign_hint_id";
    expect(() => validateGeneratedArtifact(mismatchedHintId)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    for (const field of [
      "cardRulesFingerprint",
      "planningAnnotationsFingerprint",
    ] as const) {
      const malformedFingerprint = structuredClone(generatedArtifact);
      malformedFingerprint.cards[0]![field] = "not-a-fingerprint";
      expect(() => validateGeneratedArtifact(malformedFingerprint)).toThrow(
        "invalid_card_spec_ai_hint_artifact_rows",
      );
    }

    const missingScenarioRef = {
      ...generatedArtifact,
      cards: generatedArtifact.cards.map((record, index) => {
        if (index !== 0) return record;
        const { scenarioRefs: _scenarioRefs, ...hintWithoutScenarioRefs } =
          record.hint;
        return { ...record, hint: hintWithoutScenarioRefs };
      }),
    };
    expect(() => validateGeneratedArtifact(missingScenarioRef)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    const malformedScenarioRef = {
      ...generatedArtifact,
      cards: generatedArtifact.cards.map((record, index) =>
        index === 0
          ? { ...record, hint: { ...record.hint, scenarioRefs: 1 } }
          : record,
      ),
    };
    expect(() => validateGeneratedArtifact(malformedScenarioRef)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );
  });
});
