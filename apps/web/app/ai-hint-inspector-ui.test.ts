import { describe, expect, it } from "vitest";
import {
  aiInspectorEntryKey,
  aiInspectorSections,
  containsForbiddenInspectorField,
  defaultCollapsedAiInspectorSections,
  forbiddenInspectorFields,
  type CatalogAiInspector,
} from "./ai-hint-inspector-ui";

const INSPECTOR_FIXTURE: CatalogAiInspector = {
  schemaVersion: "ai-hint-inspector-index-v1",
  source: {
    compiledHintsPath: "data/ai/ai-card-hints-compiled.json",
  },
  supportStatus: {
    aiSupportStatus: "ai_supported",
    compiledHintFound: true,
    mechanicalFactsFound: true,
    generatedFactsFound: true,
    overlayFields: [],
    legacyFallbackOnly: false,
    warningCount: 2,
  },
  compiledHint: {
    aiSupportStatus: "ai_supported",
    requiredMechanics: ["restricted_breaker_targets"],
    valueHints: { scoring: 2 },
    riskTags: ["credit_reserve"],
    scenarioRefs: ["data/scenarios/example.json#safe_probe_run"],
    manualNotes: [],
    strategicNotes: [],
  },
  mechanicalFacts: {
    effects: [{ kind: "breaker", scope: "runner", timing: "persistent" }],
    conditions: [{ kind: "requires_trace_success" }],
    costProfile: { credits: 3, reserveRisk: "low" },
    breakerProfile: {
      coverage: ["wall", "sentry"],
      pumpCost: 1,
      breakCost: 1,
    },
    remoteRole: { kind: "ice_modifier", threatLevel: "medium" },
    targetProfiles: [{ zone: "stack_top", lookCount: 5 }],
  },
  functionSignals: ["breaker.wall", "remote.ice_modifier"],
  strategyAnchors: ["runner.remote_contest"],
  lineSupport: {
    values: ["runner.remote_contest", "remote_contest"],
    classification: [
      {
        value: "runner.remote_contest",
        category: "exact_strategy_goal",
        triageCategory: "normalized_strategy_id",
        mapsTo: ["runner.remote_contest"],
        rationale: "Already normalized to a side-prefixed StrategyGoal.",
      },
      {
        value: "remote_contest",
        category: "alias_to_strategy_goal",
        triageCategory: "safe_strategy_anchor_alias",
        mapsTo: ["runner.remote_contest"],
        rationale: "Alias candidate, not an active normalized Strategy ID.",
      },
    ],
  },
  strategicRole: ["tempo_anchor", "unknown_role"],
  quality: {
    hintReviewed: true,
    strategyCovered: false,
    confidence: "low",
    needsHumanReview: true,
  },
  legacyRoles: {
    roles: ["breaker"],
    planRoles: ["build_rig"],
    rolesClassification: [
      {
        value: "breaker",
        category: "function_signal_only",
        triageCategory: "function_signal_only",
        mapsTo: [],
        rationale: "Value describes a card function.",
      },
    ],
    planRolesClassification: [
      {
        value: "build_rig",
        category: "alias_to_strategy_goal",
        triageCategory: "strategy_alias",
        mapsTo: ["runner.rig_first"],
        rationale: "Legacy role or planRole aliases to a normalized strategy.",
      },
    ],
  },
  warnings: {
    categories: ["legacy_lineSupport", "deferred_requires_human_review"],
    descriptorGaps: [
      {
        gapId: "interface_closeout_density_requires_aggregation",
        description: "DeckDoctrine aggregation gap.",
      },
    ],
    legacyStatus: {
      rolesPresent: true,
      planRolesPresent: true,
      legacyLineSupportPresent: true,
    },
    strategicRoleStatus: {
      values: ["tempo_anchor", "unknown_role"],
      validValues: ["tempo_anchor"],
      unknownValues: ["unknown_role"],
    },
  },
};

const LEGACY_ONLY_FIXTURE: CatalogAiInspector = {
  ...INSPECTOR_FIXTURE,
  supportStatus: {
    ...INSPECTOR_FIXTURE.supportStatus,
    mechanicalFactsFound: false,
    generatedFactsFound: false,
    legacyFallbackOnly: true,
    warningCount: 2,
  },
  compiledHint: {
    ...INSPECTOR_FIXTURE.compiledHint!,
    requiredMechanics: [],
    valueHints: {},
    riskTags: [],
    scenarioRefs: [],
  },
  mechanicalFacts: null,
  functionSignals: [],
  strategyAnchors: [],
  lineSupport: {
    values: [],
    classification: [],
  },
  strategicRole: [],
  quality: null,
  warnings: {
    categories: ["legacy_fallback_only", "deferred_requires_human_review"],
    descriptorGaps: [],
    legacyStatus: {
      rolesPresent: true,
      planRolesPresent: true,
    },
    strategicRoleStatus: {
      values: [],
      validValues: [],
      unknownValues: [],
    },
  },
};

const MECHANICAL_WITHOUT_TACTICS_FIXTURE: CatalogAiInspector = {
  ...INSPECTOR_FIXTURE,
  functionSignals: [],
  warnings: {
    ...INSPECTOR_FIXTURE.warnings,
    categories: [],
    descriptorGaps: [],
  },
};

describe("AI hint inspector UI view model", () => {
  it("builds the player-facing semantics sections before technical details", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(sections.map((section) => section.title)).toEqual([
      "Taktiksignale",
      "Strategieanker",
      "Strategische Rolle",
      "Prüfpunkte",
      "Herleitung / mechanische Details",
      "Interne Qualität / Reviewdaten",
      "Legacy / Migration / Entwicklerdetails",
    ]);
    expect(sections.map((section) => section.description)).toEqual([
      expect.stringContaining("Funktionssignale"),
      expect.stringContaining("Eindeutige Strategy Goals"),
      expect.stringContaining("Rolle der Karte"),
      expect.stringContaining("Human Review"),
      expect.stringContaining("regelnahen Karteninformationen"),
      expect.stringContaining("Review-Metadaten"),
      expect.stringContaining("Altbestand"),
    ]);
  });

  it("keeps derivation, internal quality and legacy details collapsed by default", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(defaultCollapsedAiInspectorSections(sections)).toEqual({
      mechanicalDetails: true,
      qualityDetails: true,
      legacyDetails: true,
    });
  });

  it("shows merged Strategy Goals once with their source", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const strategyText = sectionText(sections, "strategyAnchors");

    expect(strategyText.match(/Strategieanker runner\.remote_contest/g)).toHaveLength(1);
    expect(strategyText).toContain("Quelle: abgeleitet + lineSupport");
    expect(strategyText).not.toContain("Abgeleiteter Strategieanker");
    expect(strategyText).not.toContain("Gültiger lineSupport");
    expect(strategyText).not.toContain("remote_contest [safe_strategy_anchor_alias]");
  });

  it("shows function signals and valid strategic roles in the open main semantics", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const tacticalText = sectionText(sections, "tacticalSignals");
    const roleText = sectionText(sections, "strategicRole");

    expect(tacticalText).toContain("Taktiksignal breaker.wall");
    expect(tacticalText).toContain("Taktiksignal remote.ice_modifier");
    expect(roleText).toContain("Strategische Rolle tempo_anchor");
    expect(roleText).not.toContain("unknown_role");
    expect(openText(sections)).not.toContain("effects breaker");
    expect(openText(sections)).not.toContain("Reviewdaten hint reviewed: ja");
  });

  it("moves mechanical facts and review metadata into collapsed detail sections", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const mechanicalText = sectionText(sections, "mechanicalDetails");
    const qualityText = sectionText(sections, "qualityDetails");

    expect(mechanicalText).toContain("effects breaker");
    expect(mechanicalText).toContain("conditions requires trace success");
    expect(mechanicalText).toContain("costProfile credits: 3");
    expect(mechanicalText).toContain("breakerProfile coverage: wall, sentry");
    expect(mechanicalText).toContain("remoteRole kind: ice_modifier");
    expect(mechanicalText).toContain("targetProfiles");
    expect(mechanicalText).toContain("Compiled source data/ai/ai-card-hints-compiled.json");
    expect(qualityText).toContain("Reviewdaten hint reviewed: ja");
    expect(qualityText).toContain("Reviewdaten confidence: low");
    expect(qualityText).not.toContain("economyQuality");
  });

  it("keeps full legacy roles and planRoles out of the open main view", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const text = openText(sections);

    expect(text).toContain("Legacy-Daten vorhanden");
    expect(text).toContain("Details unter Legacy / Migration.");
    expect(text).not.toContain("Legacy roles breaker");
    expect(text).not.toContain("Legacy planRoles build_rig");
    expect(text).not.toContain("Legacy-lineSupport remote_contest");
    expect(text).not.toContain("Legacy roles-Klassifikation breaker [function_signal_only]");
    expect(text).not.toContain("Legacy planRoles-Klassifikation build_rig [strategy_alias]");
  });

  it("keeps legacy roles, planRoles, alias classifications and raw categories in the closed developer section", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const text = sectionText(sections, "legacyDetails");

    expect(text).toContain("Diese Felder gehören zum bisherigen KI-Pfad");
    expect(text).toContain("Runtime-Legacy KI nutzt Legacy teilweise");
    expect(text).toContain("Hinweis: Legacy-Rollen werden intern noch teilweise von der KI verwendet.");
    expect(text).toContain("card-role-manifest Runtime-Legacy");
    expect(text).toContain("Legacy roles breaker");
    expect(text).toContain("Legacy planRoles build_rig");
    expect(text).toContain("Legacy-lineSupport remote_contest [safe_strategy_anchor_alias] -> runner.remote_contest");
    expect(text).toContain("Legacy roles-Klassifikation breaker [function_signal_only]");
    expect(text).toContain("Legacy planRoles-Klassifikation build_rig [strategy_alias] -> runner.rig_first");
    expect(text).toContain("Hinweis-Kategorie legacy line support");
  });

  it("groups relevant warnings in the main view without expanding legacy warnings", () => {
    const text = sectionText(aiInspectorSections(INSPECTOR_FIXTURE), "checkpoints");

    expect(text).toContain("Human Review needs_human_review");
    expect(text).toContain("Confidence low confidence low");
    expect(text).toContain("Deferred / Human Review deferred requires human review");
    expect(text).toContain("Descriptor-Gap Descriptor-Gap interface_closeout_density_requires_aggregation");
    expect(text).toContain("Legacy / Migration Legacy-Daten vorhanden");
    expect(text).not.toContain("legacy line support");
    expect(text).not.toContain("hint reviewed");
    expect(text).not.toContain("strategy covered");
  });

  it("keeps cards without active strategy goals readable", () => {
    const sections = aiInspectorSections({
      ...INSPECTOR_FIXTURE,
      strategyAnchors: [],
      lineSupport: { values: [], classification: [] },
    });

    expect(sectionText(sections, "strategyAnchors")).toContain(
      "Strategieanker Keine aktive Strategiezuordnung",
    );
  });

  it("shows legacy-only cards as no active strategy plus compact legacy notice", () => {
    const sections = aiInspectorSections(LEGACY_ONLY_FIXTURE);
    const text = openText(sections);

    expect(sectionText(sections, "tacticalSignals")).toContain("Keine Taktiksignale vorhanden");
    expect(sectionText(sections, "strategyAnchors")).toContain(
      "Strategieanker Keine aktive Strategiezuordnung",
    );
    expect(text).toContain("Legacy-Daten vorhanden");
    expect(defaultCollapsedAiInspectorSections(sections).legacyDetails).toBe(true);
  });

  it("calls out cards with mechanical details but no derived tactic signals", () => {
    const sections = aiInspectorSections(MECHANICAL_WITHOUT_TACTICS_FIXTURE);

    expect(sectionText(sections, "tacticalSignals")).toContain("Keine Taktiksignale vorhanden");
    expect(sectionText(sections, "tacticalSignals")).toContain(
      "Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet.",
    );
    expect(sectionText(sections, "checkpoints")).toContain(
      "Taktiksignal-Lücke Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet",
    );
  });

  it("does not expose a raw JSON wall in the default view", () => {
    const text = openText(aiInspectorSections(INSPECTOR_FIXTURE));

    expect(text).not.toContain('"kind"');
    expect(text).not.toContain("{");
    expect(text).not.toContain("}");
  });

  it("does not expose hidden or runtime-only field names", () => {
    expect(containsForbiddenInspectorField(INSPECTOR_FIXTURE)).toBe(false);
    expect(
      forbiddenInspectorFields({
        cardInstances: [],
        nested: { stateHash: "forbidden" },
        planner: { actionScores: [] },
      }),
    ).toEqual(["actionScores", "cardInstances", "stateHash"]);
  });

  it("renders active sections before legacy and debug details", () => {
    const keys = aiInspectorSections(INSPECTOR_FIXTURE).map((section) => section.key);

    expect(keys.indexOf("tacticalSignals")).toBeLessThan(keys.indexOf("mechanicalDetails"));
    expect(keys.indexOf("strategyAnchors")).toBeLessThan(keys.indexOf("mechanicalDetails"));
    expect(keys.indexOf("strategicRole")).toBeLessThan(keys.indexOf("qualityDetails"));
    expect(keys.indexOf("checkpoints")).toBeLessThan(keys.indexOf("legacyDetails"));
    expect(keys.indexOf("mechanicalDetails")).toBeLessThan(keys.indexOf("legacyDetails"));
    expect(keys.indexOf("qualityDetails")).toBeLessThan(keys.indexOf("legacyDetails"));
    expect(keys.indexOf("tacticalSignals")).toBeLessThan(keys.indexOf("legacyDetails"));
  });

  it("creates unique render keys when cards have repeated mechanical effects", () => {
    const sections = aiInspectorSections({
      ...INSPECTOR_FIXTURE,
      mechanicalFacts: {
        ...INSPECTOR_FIXTURE.mechanicalFacts!,
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "draw", amount: 2 },
        ],
      },
    });
    const activeSection = sections.find((section) => section.key === "mechanicalDetails");
    expect(activeSection).toBeDefined();

    const effectEntries = activeSection!.entries.filter(
      (entry) => entry.label === "effects" && entry.value === "draw",
    );
    const keys = activeSection!.entries.map((entry, index) =>
      aiInspectorEntryKey(activeSection!.key, entry, index),
    );

    expect(effectEntries).toHaveLength(2);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

function openText(sections: ReturnType<typeof aiInspectorSections>): string {
  const collapsed = defaultCollapsedAiInspectorSections(sections);
  return flattenedText(sections.filter((section) => !collapsed[section.key]));
}

function sectionText(sections: ReturnType<typeof aiInspectorSections>, key: string): string {
  return flattenedText(sections.filter((section) => section.key === key));
}

function flattenedText(sections: ReturnType<typeof aiInspectorSections>): string {
  return sections
    .flatMap((section) => {
      if (section.entries.length === 0) return section.emptyText ? [section.emptyText] : [];
      return section.entries.map((entry) =>
        [entry.label, entry.value, entry.detail].filter(Boolean).join(" "),
      );
    })
    .join("\n");
}
