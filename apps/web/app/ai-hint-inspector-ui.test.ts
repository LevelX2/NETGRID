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
    values: ["runner.remote_contest"],
    classification: [
      {
        value: "runner.remote_contest",
        category: "exact_strategy_goal",
        triageCategory: "normalized_strategy_id",
        mapsTo: ["runner.remote_contest"],
        rationale: "Already normalized to a side-prefixed StrategyGoal.",
      },
    ],
  },
  strategicRole: [],
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
    categories: ["legacy_lineSupport"],
    descriptorGaps: [
      {
        gapId: "interface_closeout_density_requires_aggregation",
        description: "DeckDoctrine aggregation gap.",
      },
    ],
    legacyStatus: {},
    strategicRoleStatus: {},
  },
};

describe("AI hint inspector UI view model", () => {
  it("builds the required read-only card catalog sections", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(sections.map((section) => section.title)).toEqual([
      "Function-Signals",
      "Strategie / lineSupport",
      "Strategic Role",
      "Mechanische Facts",
      "Supportstatus",
      "Quality",
      "Compiled Hint / Quelle",
      "Legacy-Rollen",
      "Warnings / Gaps / Legacy",
    ]);
  });

  it("opens only the future-facing value sections by default", () => {
    const sections = aiInspectorSections(INSPECTOR_FIXTURE);
    expect(defaultCollapsedAiInspectorSections(sections)).toEqual({
      support: true,
      quality: true,
      compiled: true,
      legacyRoles: true,
      warnings: true,
    });
  });

  it("shows support, compiled facts, function signals, strategy, quality and warnings without raw JSON", () => {
    const text = flattenedText(aiInspectorSections(INSPECTOR_FIXTURE));

    expect(text).toContain("KI geeignet");
    expect(text).toContain("Compiled Hint");
    expect(text).toContain("Effekt");
    expect(text).toContain("breaker");
    expect(text).toContain("Breaker");
    expect(text).toContain("RemoteRole");
    expect(text).toContain("breaker.wall");
    expect(text).toContain("runner.remote_contest [normalized_strategy_id]");
    expect(text).toContain("StrategicRole nicht gesetzt");
    expect(text).toContain("hint reviewed: ja");
    expect(text).toContain("roles breaker [function_signal_only]");
    expect(text).toContain("planRoles build_rig [strategy_alias] -> runner.rig_first");
    expect(text).toContain("Warning legacy line support");
    expect(text).toContain("Descriptor-Gap interface_closeout_density_requires_aggregation");
    expect(text).not.toContain("economyQuality");
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
      }),
    ).toEqual(["cardInstances", "stateHash"]);
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
    const mechanicalSection = sections.find((section) => section.key === "mechanical");
    expect(mechanicalSection).toBeDefined();

    const effectEntries = mechanicalSection!.entries.filter(
      (entry) => entry.label === "Effekt" && entry.value === "draw",
    );
    const keys = mechanicalSection!.entries.map((entry, index) =>
      aiInspectorEntryKey(mechanicalSection!.key, entry, index),
    );

    expect(effectEntries).toHaveLength(2);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

function flattenedText(sections: ReturnType<typeof aiInspectorSections>): string {
  return sections
    .flatMap((section) =>
      section.entries.map((entry) =>
        [entry.label, entry.value, entry.detail].filter(Boolean).join(" "),
      ),
    )
    .join("\n");
}
