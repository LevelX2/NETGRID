import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type MigrationReport = {
  setId: string;
  sourceCommit: string;
  counts: {
    rawCards: number;
    legacyImplementationModules: number;
    existingCardSpecs: number;
    existingAddressableNodes: number;
    generatedCardSpecs: number;
    addressableNodes: number;
    totalCardSpecs: number;
    totalAddressableNodes: number;
  };
  sharedDefinitionParity: {
    sharedAbilitySlots: number;
    sharedAbilityTargetSlots: number;
    sharedStaticCharacteristicCards: number;
    sharedStaticCharacteristicFacts: number;
    printedSubroutines: {
      sharedCards: number;
      sharedNodes: number;
      effectiveLegacyCards: number;
      effectiveLegacyNodes: number;
      drift: readonly {
        cardDefinitionId: string;
        shared: number;
        effectiveLegacy: number;
        disposition: string;
      }[];
    };
  };
  capabilityDisposition: { required: number; authored: number; status: string };
  planningAnnotationDisposition: {
    status: string;
    dispositionFingerprint: string;
    aggregatePlanningAnnotationsFingerprint: string;
    sourceEvidence: {
      sourceCardStrategyPairs: number;
      sourceActionStrategyPairs: number;
      discardedUnaddressableActionPairs: number;
      sourceTargetProfiles: number;
      sourceRemoteRoles: number;
      sourceValueHints: number;
    };
    projected: {
      cardsWithAnnotations: number;
      cardAnnotations: number;
      capabilityGroups: number;
      capabilityAnnotations: number;
      annotationKinds: Record<string, number>;
    };
    discarded: {
      mechanicalPlanRoleOccurrences: number;
      compilerOwnedTacticSignalOccurrences: number;
      valueHintOccurrences: number;
      unaddressableActionStrategyPairs: number;
      compilerOwnedFields: readonly string[];
    };
  };
  idPartition: {
    generatedCardSpecIds: readonly string[];
    existingCardSpecIds: readonly string[];
    projectedImplementationIds: readonly string[];
    definitionOnlyIds: readonly string[];
  };
  cards: readonly {
    cardDefinitionId: string;
    sourceFingerprint: string;
    outputFingerprint: string;
    planningAnnotationsFingerprint: string;
    rawCard: {
      cardId: string;
      numeric: { strength: number | null };
      variableStrength?: { kind: "random_die"; dieSides: number };
    };
    capabilitySlots: readonly {
      family: string;
      sourceIndex: number;
      sourceFingerprint: string;
      capabilityKey: string;
    }[];
  }[];
  aggregateOutputFingerprint: string;
};

const root = process.cwd();
const specRoot = path.join(root, "packages/cards/src/specs/originalset-v1");
const report = JSON.parse(
  readFileSync(
    path.join(
      root,
      "docs/reviews/cards/originalset-v1-card-spec-migration-report.json",
    ),
    "utf8",
  ),
) as MigrationReport;

describe("Originalset V1 CardSpec projection parity", () => {
  it("pins the complete generated inventory and explicit addressability", () => {
    expect(report.setId).toBe("originalset-v1");
    expect(report.sourceCommit).toBe(
      "7ce7675d9dd99347d009c3928b44968d5dd80eb0",
    );
    expect(report.counts).toMatchObject({
      rawCards: 367,
      legacyImplementationModules: 366,
      existingCardSpecs: 7,
      existingAddressableNodes: 9,
      generatedCardSpecs: 367,
      addressableNodes: 406,
      totalCardSpecs: 374,
      totalAddressableNodes: 415,
    });
    expect(report.capabilityDisposition).toEqual({
      required: 406,
      authored: 406,
      status: "explicit_reviewed_disposition",
    });
    expect(
      readdirSync(specRoot).filter((file) => file.endsWith(".card-spec.ts")),
    ).toHaveLength(374);
    expect(report.idPartition.generatedCardSpecIds).toHaveLength(367);
    expect(report.idPartition.existingCardSpecIds).toHaveLength(7);
    expect(report.idPartition.projectedImplementationIds).toHaveLength(366);
    expect(report.idPartition.definitionOnlyIds).toEqual([
      "onr_v1_220_tycho-extension",
    ]);
    expect(report.cards).toHaveLength(367);
    expect(
      report.cards.every(
        (card) =>
          card.sourceFingerprint.startsWith("sha256:") &&
          card.outputFingerprint.startsWith("sha256:") &&
          card.capabilitySlots.every(
            (slot) =>
              slot.sourceFingerprint.startsWith("sha256:") &&
              /^[a-z][a-z0-9_]*$/.test(slot.capabilityKey),
          ),
      ),
    ).toBe(true);
    expect(report.aggregateOutputFingerprint).toMatch(/^sha256:/);
  });

  it("keeps the pinned Shared evidence and effective Legacy printed authority", () => {
    expect(report.sharedDefinitionParity).toMatchObject({
      sharedAbilitySlots: 59,
      sharedAbilityTargetSlots: 61,
      sharedStaticCharacteristicCards: 35,
      sharedStaticCharacteristicFacts: 40,
      printedSubroutines: {
        sharedCards: 60,
        sharedNodes: 97,
        effectiveLegacyCards: 60,
        effectiveLegacyNodes: 99,
      },
    });
    expect(report.sharedDefinitionParity.printedSubroutines.drift).toEqual([
      {
        cardDefinitionId: "onr_v1_260_pocket-virtual-reality",
        shared: 1,
        effectiveLegacy: 2,
        disposition: "preserve_effective_legacy_runtime_subroutines",
      },
      {
        cardDefinitionId: "onr_v1_276_viral-15",
        shared: 1,
        effectiveLegacy: 2,
        disposition: "preserve_effective_legacy_runtime_subroutines",
      },
    ]);
  });

  it("projects every generated Raw strength model into canonical characteristics", () => {
    for (const { rawCard } of report.cards) {
      const source = readFileSync(
        path.join(specRoot, `${rawCard.cardId}.card-spec.ts`),
        "utf8",
      );
      const expected = rawCard.variableStrength ??
        (rawCard.numeric.strength === null
          ? { kind: "not_applicable" }
          : { kind: "fixed", value: rawCard.numeric.strength });
      expect(source, rawCard.cardId).toContain(
        Object.entries(expected)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)},`)
          .join("\n        "),
      );
    }
  });

  it("binds the closed non-mechanical planning projection and its exclusions", () => {
    expect(report.planningAnnotationDisposition).toMatchObject({
      status: "closed_nonmechanical_projection",
      sourceEvidence: {
        sourceCardStrategyPairs: 144,
        sourceActionStrategyPairs: 51,
        discardedUnaddressableActionPairs: 4,
        sourceTargetProfiles: 77,
        sourceRemoteRoles: 51,
        sourceValueHints: 119,
      },
      projected: {
        cardsWithAnnotations: 358,
        cardAnnotations: 1714,
        capabilityGroups: 36,
        capabilityAnnotations: 48,
        annotationKinds: {
          line_support: 178,
          plan_role: 524,
          remote_role: 51,
          strategic_exchange: 8,
          strategic_role: 165,
          strategy_anchor: 185,
          strategy_support: 192,
          tactic_interpretation: 275,
          target_preference: 77,
          value_interpretation: 107,
        },
      },
      discarded: {
        mechanicalPlanRoleOccurrences: 133,
        compilerOwnedTacticSignalOccurrences: 2631,
        valueHintOccurrences: 12,
        unaddressableActionStrategyPairs: 4,
      },
    });
    expect(
      report.planningAnnotationDisposition.dispositionFingerprint,
    ).toMatch(/^sha256:/);
    expect(
      report.planningAnnotationDisposition
        .aggregatePlanningAnnotationsFingerprint,
    ).toMatch(/^sha256:/);
    expect(
      report.cards.every((card) =>
        card.planningAnnotationsFingerprint.startsWith("sha256:"),
      ),
    ).toBe(true);

    const forbiddenPlanningFields = [
      "actionCapacityProfiles",
      "aiSupportStatus",
      "breakerProfile",
      "conditions",
      "constraints",
      "costProfile",
      "effects",
      "functionSignals",
      "hiddenInfoPolicy",
      "manualNotes",
      "quality",
      "requiredMechanics",
      "riskTags",
      "roles",
      "scenarioRefs",
      "strategicNotes",
    ];
    for (const card of report.cards) {
      const source = readFileSync(
        path.join(specRoot, `${card.cardDefinitionId}.card-spec.ts`),
        "utf8",
      );
      const planningStart = source.indexOf("  planningAnnotations:");
      if (planningStart < 0) continue;
      const planningEnd = source.indexOf("  printings:", planningStart);
      const planningSource = source.slice(planningStart, planningEnd);
      for (const field of forbiddenPlanningFields)
        expect(planningSource, `${card.cardDefinitionId}:${field}`).not.toMatch(
          new RegExp(`\\b${field}\\s*:`),
        );
    }
  });

  it("preserves the seven prior Originalset specs byte-for-byte", () => {
    const existingIds = [
      "onr_v1_110_sneak-preview",
      "onr_v1_154_broker",
      "onr_v1_168_loan-from-chiba",
      "onr_v1_197_data-fort-reclamation",
      "onr_v1_317_data-masons",
      "onr_v1_348_virus-test-site",
      "onr_v1_368_roving-submarine",
    ];
    const source = existingIds
      .map((id) =>
        readFileSync(path.join(specRoot, `${id}.card-spec.ts`), "utf8"),
      )
      .join("\n");
    expect(createHash("sha256").update(source).digest("hex")).toBe(
      "4af79b4d2f6550967e389870e46a411d8ef11e047f668b90c62b981db75c4f50",
    );
  });
});
