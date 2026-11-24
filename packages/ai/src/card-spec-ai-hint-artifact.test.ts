import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listPlanningCardsWithFacts } from "@netgrid/cards/planning";
import { cardSpecRuntimeDefinitionIds } from "@netgrid/cards/engine";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";

import generatedArtifact from "../../../data/ai/card-spec-ai-hints-generated.json";
import scenarioPack from "../../../data/scenarios/card-support-ai-supported-current.json";
import classicReviewedGolden from "./test-fixtures/classic-card-spec-ai-hints-reviewed-v1.json";
import proteusReviewedGolden from "./test-fixtures/proteus-card-spec-ai-hints-reviewed-v1.json";
import testsetReviewedGolden from "./test-fixtures/testset-card-spec-ai-hints-reviewed-v1.json";
import {
  buildCardSpecAiHintArtifact,
  serializeCardSpecAiHintArtifact,
} from "../../../scripts/lib/card-spec-ai-hint-artifact-builder";
import { validateGeneratedArtifact } from "./generated-ai-hint-artifact-validation";

describe("CardSpec generated AI hint artifact", () => {
  it.each([
    [{ effects: [{ kind: "nonexistent_effect" }] }, "[0].effects[0].kind"],
    [
      { targetProfiles: [{ zone: "foreign_zone" }] },
      "[0].targetProfiles[0].zone",
    ],
    [
      {
        strategySupportPairs: [
          {
            strategyId: "score",
            role: "nonexistent_role",
            confidence: "metadata",
            evidence: ["fixture"],
          },
        ],
      },
      "[0].strategySupportPairs[0].role",
    ],
    [{ costProfile: { credits: -1 } }, "[0].costProfile.credits"],
    [{ unexpectedField: true }, "[0]"],
  ] as const)(
    "validates stored capability semantics at %s",
    (changes, field) => {
      const cardId = 5;
      const artifact = {
        ...generatedArtifact,
        cards: generatedArtifact.cards.map((record) =>
          record.cardId === cardId
            ? {
                ...record,
                hint: {
                  ...record.hint,
                  actionCapabilitySemantics: [
                    {
                      capabilityKey: "spend_remap_counter_end_run",
                      ...changes,
                    },
                  ],
                },
              }
            : record,
        ),
      };
      expect(() => validateGeneratedArtifact(artifact)).toThrow(
        "invalid_card_spec_ai_hint_artifact_hint:" +
          cardId +
          ":$.actionCapabilitySemantics" +
          field,
      );
    },
  );

  it("is the canonical active output of the current compiler inputs", async () => {
    const compiled = buildCardSpecAiHintArtifact();

    expect(compiled).toEqual(generatedArtifact);
    expect(compiled.cardIds.length).toBeGreaterThanOrEqual(618);
    expect(
      compiled.cardIds.filter((cardId) => cardId === 1 || cardId === 2),
    ).toEqual([]);
    expect(compiled.cardIds).toEqual(
      [...compiled.cardIds].sort((left, right) => left - right),
    );
    expect(compiled.cards.map((entry) => entry.cardId)).toEqual(
      compiled.cardIds,
    );
    expect(await serializeCardSpecAiHintArtifact(compiled)).toBe(
      readFileSync(
        fileURLToPath(
          new URL(
            "../../../data/ai/card-spec-ai-hints-generated.json",
            import.meta.url,
          ),
        ),
        "utf8",
      ),
    );
  });

  it("changes for rules and planning-annotation fingerprint drift", () => {
    const entries = listPlanningCardsWithFacts();
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
    const entries = listPlanningCardsWithFacts();
    const reviewedExpectedIds = [...cardSpecRuntimeDefinitionIds()].sort(
      (left, right) => left - right,
    );
    const publishedIds = new Set(reviewedExpectedIds);
    for (const { cardId } of [
      ...testsetReviewedGolden.cards,
      ...classicReviewedGolden.cards,
      ...proteusReviewedGolden.cards,
    ])
      expect(publishedIds.has(cardId)).toBe(true);
    expect(reviewedExpectedIds.length).toBeGreaterThanOrEqual(618);
    expect(publishedIds.size).toBe(reviewedExpectedIds.length);
    expect(generatedArtifact.cardIds).toEqual(reviewedExpectedIds);
    expect(
      entries
        .map((entry) => entry.facts.id)
        .sort((left, right) => left - right),
    ).toEqual(reviewedExpectedIds);

    expect(() =>
      buildCardSpecAiHintArtifact({ entries: entries.slice(1) }),
    ).toThrow("card_spec_ai_hint_artifact_input_mismatch");

    const foreign = entries.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            facts: {
              ...entry.facts,
              id: 100000,
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
      .coversCards.push(100000);
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
        "data/ai/card-spec-ai-hints-generated.json",
        "data/scenarios/card-support-ai-supported-current.json",
        "packages/ai/src/action-plan-owner-contracts.ts",
        "packages/ai/src/ai-hint-contracts.ts",
        "packages/ai/src/catalog-ai-hint-authority.ts",
        "packages/ai/src/catalog-ai-hint-public.ts",
        "packages/ai/src/generated-ai-hint-artifact-validation.ts",
        "packages/ai/src/hint-ontology.ts",
        "packages/runtime-data/src/card-spec-ai-hints.ts",
        "packages/runtime-data/src/card-support.ts",
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

    const unrelatedCard = structuredClone(generatedArtifact);
    unrelatedCard.cardIds[0] = 1;
    unrelatedCard.cards[0]!.cardId = 1;
    unrelatedCard.cards[0]!.hint.cardId = 1;
    expect(() => validateGeneratedArtifact(unrelatedCard)).toThrow(
      "invalid_card_spec_ai_hint_artifact_rows",
    );

    const missingRow = structuredClone(generatedArtifact);
    missingRow.cards.pop();
    expect(() => validateGeneratedArtifact(missingRow)).toThrow(
      "invalid_card_spec_ai_hint_artifact_contract",
    );

    const mismatchedHintId = structuredClone(generatedArtifact);
    mismatchedHintId.cards[0]!.hint.cardId = 2;
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
