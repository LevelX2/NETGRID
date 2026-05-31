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
    confidence: "medium",
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

describe("AI hint inspector UI view model", () => {
  it("builds the active-semantics first card catalog sections", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(sections.map((section) => section.title)).toEqual([
      "Supportstatus",
      "Aktive KI-Semantik",
      "Strategieanker",
      "Hinweise / Prüfpunkte",
      "Legacy / Entwicklerdetails anzeigen",
    ]);
  });

  it("keeps only the legacy developer details collapsed by default", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(defaultCollapsedAiInspectorSections(sections)).toEqual({
      legacyDetails: true,
    });
  });

  it("shows valid Strategy Goals and derived Strategy Anchors in the main view", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const strategyText = sectionText(sections, "strategyAnchors");

    expect(strategyText).toContain("Abgeleiteter Strategieanker runner.remote_contest");
    expect(strategyText).toContain("Gültiger lineSupport runner.remote_contest");
    expect(strategyText).not.toContain("remote_contest [safe_strategy_anchor_alias]");
  });

  it("shows function signals, mechanical facts, valid strategic roles and existing quality fields in active semantics", () => {
    const text = sectionText(aiInspectorSections(INSPECTOR_FIXTURE), "activeSemantics");

    expect(text).toContain("Effekt breaker");
    expect(text).toContain("Bedingung requires trace success");
    expect(text).toContain("Kostenprofil credits: 3");
    expect(text).toContain("Breaker coverage: wall, sentry");
    expect(text).toContain("RemoteRole kind: ice_modifier");
    expect(text).toContain("Target");
    expect(text).toContain("Funktionssignal breaker.wall");
    expect(text).toContain("Funktionssignal remote.ice_modifier");
    expect(text).toContain("Strategic Role tempo_anchor");
    expect(text).not.toContain("unknown_role");
    expect(text).toContain("Quality hint reviewed: ja");
    expect(text).not.toContain("economyQuality");
  });

  it("keeps full legacy roles and planRoles out of the open main view", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const text = openText(sections);

    expect(text).toContain("Legacy-Daten vorhanden:");
    expect(text).not.toContain("Legacy-Rollen breaker");
    expect(text).not.toContain("Legacy-Planrollen build_rig");
    expect(text).not.toContain("Legacy-lineSupport remote_contest");
    expect(text).not.toContain("Legacy-Rollen-Klassifikation breaker [function_signal_only]");
    expect(text).not.toContain("Legacy-Planrollen-Klassifikation build_rig [strategy_alias]");
  });

  it("keeps legacy roles, planRoles, alias classifications and raw categories in the closed developer section", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    const text = sectionText(sections, "legacyDetails");

    expect(text).toContain("Legacy-Rollen breaker");
    expect(text).toContain("Legacy-Planrollen build_rig");
    expect(text).toContain("Legacy-lineSupport remote_contest [safe_strategy_anchor_alias] -> runner.remote_contest");
    expect(text).toContain("Legacy-Rollen-Klassifikation breaker [function_signal_only]");
    expect(text).toContain("Legacy-Planrollen-Klassifikation build_rig [strategy_alias] -> runner.rig_first");
    expect(text).toContain("Hinweis-Kategorie legacy line support");
  });

  it("groups relevant warnings in the main view without expanding legacy warnings", () => {
    const text = sectionText(aiInspectorSections(INSPECTOR_FIXTURE), "notices");

    expect(text).toContain("Prüfen deferred requires human review");
    expect(text).toContain("Prüfen Descriptor-Gap interface_closeout_density_requires_aggregation");
    expect(text).toContain("Legacy Legacy-Daten vorhanden:");
    expect(text).not.toContain("legacy line support");
  });

  it("keeps cards without active strategy goals readable", () => {
    const sections = aiInspectorSections({
      ...INSPECTOR_FIXTURE,
      strategyAnchors: [],
      lineSupport: { values: [], classification: [] },
    });

    expect(sectionText(sections, "strategyAnchors")).toContain(
      "Strategieanker keine aktive Strategiezuordnung",
    );
  });

  it("shows legacy-only cards as no active strategy plus compact legacy notice", () => {
    const sections = aiInspectorSections(LEGACY_ONLY_FIXTURE);
    const text = openText(sections);

    expect(sectionText(sections, "activeSemantics")).toBe("");
    expect(sectionText(sections, "strategyAnchors")).toContain(
      "Strategieanker keine aktive Strategiezuordnung",
    );
    expect(text).toContain("Legacy-Daten vorhanden:");
    expect(defaultCollapsedAiInspectorSections(sections).legacyDetails).toBe(true);
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

    expect(keys.indexOf("activeSemantics")).toBeLessThan(keys.indexOf("legacyDetails"));
    expect(keys.indexOf("strategyAnchors")).toBeLessThan(keys.indexOf("legacyDetails"));
    expect(keys.indexOf("notices")).toBeLessThan(keys.indexOf("legacyDetails"));
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
    const activeSection = sections.find((section) => section.key === "activeSemantics");
    expect(activeSection).toBeDefined();

    const effectEntries = activeSection!.entries.filter(
      (entry) => entry.label === "Effekt" && entry.value === "draw",
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
    .flatMap((section) =>
      section.entries.map((entry) =>
        [entry.label, entry.value, entry.detail].filter(Boolean).join(" "),
      ),
    )
    .join("\n");
}
