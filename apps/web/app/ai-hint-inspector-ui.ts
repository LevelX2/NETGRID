export type AiInspectorTone = "valid" | "warning" | "danger" | "info" | "legacy";

export type CatalogAiInspectorClassification = {
  value: string;
  category: string;
  triageCategory: string;
  mapsTo: string[];
  rationale: string;
};

export type CatalogAiInspector = {
  schemaVersion: string;
  source: Record<string, unknown>;
  supportStatus: {
    aiSupportStatus: string;
    compiledHintFound: boolean;
    mechanicalFactsFound: boolean;
    generatedFactsFound: boolean;
    overlayFields: string[];
    legacyFallbackOnly: boolean;
    warningCount: number;
  };
  compiledHint: {
    aiSupportStatus: string;
    requiredMechanics: string[];
    valueHints: Record<string, number>;
    riskTags: string[];
    scenarioRefs: string[];
    manualNotes: string[];
    strategicNotes: string[];
  } | null;
  mechanicalFacts: {
    effects: Array<Record<string, unknown>>;
    conditions: Array<Record<string, unknown>>;
    costProfile: Record<string, unknown> | null;
    breakerProfile: Record<string, unknown> | null;
    remoteRole: Record<string, unknown> | null;
    targetProfiles: Array<Record<string, unknown>>;
  } | null;
  functionSignals: string[];
  strategyAnchors: string[];
  lineSupport: {
    values: string[];
    classification: CatalogAiInspectorClassification[];
  };
  strategicRole: string[];
  quality: Record<string, unknown> | null;
  legacyRoles: {
    roles: string[];
    planRoles: string[];
    rolesClassification: CatalogAiInspectorClassification[];
    planRolesClassification: CatalogAiInspectorClassification[];
  };
  warnings: {
    categories: string[];
    descriptorGaps: Array<Record<string, unknown>>;
    legacyStatus: Record<string, unknown>;
    strategicRoleStatus: Record<string, unknown>;
  };
};

export type AiInspectorEntry = {
  label: string;
  value?: string;
  detail?: string;
  tone: AiInspectorTone;
};

export type AiInspectorSection = {
  key: string;
  title: string;
  emptyText?: string;
  entries: AiInspectorEntry[];
};

const FORBIDDEN_RUNTIME_KEYS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "fullState",
  "stateSnapshots",
  "undoSnapshots",
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
];

export function aiInspectorSections(inspector: CatalogAiInspector): AiInspectorSection[] {
  return [
    functionSignalSection(inspector),
    lineSupportSection(inspector),
    strategicRoleSection(inspector),
    mechanicalFactsSection(inspector),
    supportStatusSection(inspector),
    qualitySection(inspector),
    compiledHintSection(inspector),
    legacyRoleSection(inspector),
    warningSection(inspector),
  ];
}

export function defaultCollapsedAiInspectorSections(sections: AiInspectorSection[]): Record<string, boolean> {
  const openByDefault = new Set(["functions", "strategy", "strategicRole", "mechanical"]);
  return Object.fromEntries(
    sections
      .filter((section) => !openByDefault.has(section.key))
      .map((section) => [section.key, true]),
  );
}

export function aiInspectorEntryKey(sectionKey: string, entry: AiInspectorEntry, index: number): string {
  return `${sectionKey}-${index}-${entry.label}-${entry.value ?? "empty"}`;
}

export function aiInspectorToneForCategory(category: string): AiInspectorTone {
  if (
    [
      "normalized_strategy_id",
      "exact_strategy_goal",
      "safe_strategy_anchor_alias",
      "ai_supported",
    ].includes(category)
  ) {
    return "valid";
  }
  if (
    category.includes("missing") ||
    category.includes("invalid") ||
    category.includes("unknown") ||
    category.includes("wrong_side") ||
    category === "should_be_removed_from_lineSupport"
  ) {
    return "danger";
  }
  if (
    category.includes("legacy") ||
    category.includes("deferred") ||
    category.includes("descriptor_gap") ||
    category.includes("requires_card_review")
  ) {
    return "warning";
  }
  if (category.includes("function_signal") || category.includes("fallback")) return "info";
  return "legacy";
}

export function formatAiInspectorLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

export function containsForbiddenInspectorField(value: unknown): boolean {
  return forbiddenInspectorFields(value).length > 0;
}

export function forbiddenInspectorFields(value: unknown, found = new Set<string>()): string[] {
  if (value === null || typeof value !== "object") return [...found].sort();
  if (Array.isArray(value)) {
    for (const item of value) forbiddenInspectorFields(item, found);
    return [...found].sort();
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_RUNTIME_KEYS.includes(key)) found.add(key);
    forbiddenInspectorFields(child, found);
  }
  return [...found].sort();
}

function supportStatusSection(inspector: CatalogAiInspector): AiInspectorSection {
  const support = inspector.supportStatus;
  return {
    key: "support",
    title: "Supportstatus",
    entries: [
      {
        label: "KI geeignet",
        value: support.aiSupportStatus === "ai_supported" ? "ja" : formatAiInspectorLabel(support.aiSupportStatus),
        tone: support.aiSupportStatus === "ai_supported" ? "valid" : "info",
      },
      {
        label: "Compiled Hint",
        value: support.compiledHintFound ? "vorhanden" : "fehlt",
        tone: support.compiledHintFound ? "valid" : "danger",
      },
      {
        label: "Mechanische Facts",
        value: support.mechanicalFactsFound ? "vorhanden" : "nicht gesetzt",
        tone: support.mechanicalFactsFound ? "valid" : "info",
      },
      {
        label: "Generated Facts",
        value: support.generatedFactsFound ? "ja" : "nein",
        detail: "Aus stabilen compiled-vs-active/overlay-Feldern abgeleitet.",
        tone: support.generatedFactsFound ? "valid" : "info",
      },
      {
        label: "Overlay",
        value: support.overlayFields.length > 0 ? support.overlayFields.join(", ") : "nein",
        tone: support.overlayFields.length > 0 ? "info" : "legacy",
      },
      {
        label: "Warnings",
        value: String(support.warningCount),
        tone: support.warningCount > 0 ? "warning" : "valid",
      },
    ],
  };
}

function compiledHintSection(inspector: CatalogAiInspector): AiInspectorSection {
  const hint = inspector.compiledHint;
  const entries: AiInspectorEntry[] = [
    {
      label: "Quelle",
      value: String(inspector.source.compiledHintsPath ?? "compiled hint"),
      tone: "info",
    },
  ];
  if (!hint) {
    entries.push({ label: "Compiled Hint", value: "nicht vorhanden", tone: "danger" });
    return { key: "compiled", title: "Compiled Hint / Quelle", entries };
  }
  entries.push(...stringEntries("Mechaniken", hint.requiredMechanics, "info"));
  entries.push(...keyValueEntries("Werte", hint.valueHints, "info"));
  entries.push(...stringEntries("Risiken", hint.riskTags, "warning"));
  entries.push(...stringEntries("Szenarien", hint.scenarioRefs.map(shortScenarioRef), "info"));
  entries.push(...stringEntries("Manual Notes", hint.manualNotes, "legacy"));
  entries.push(...stringEntries("Strategic Notes", hint.strategicNotes, "legacy"));
  return {
    key: "compiled",
    title: "Compiled Hint / Quelle",
    emptyText: "Keine zusätzlichen compiled Hint-Felder.",
    entries,
  };
}

function mechanicalFactsSection(inspector: CatalogAiInspector): AiInspectorSection {
  const facts = inspector.mechanicalFacts;
  const entries: AiInspectorEntry[] = [];
  if (!facts) {
    return {
      key: "mechanical",
      title: "Mechanische Facts",
      emptyText: "Keine mechanischen Facts vorhanden.",
      entries,
    };
  }
  entries.push(...recordListEntries("Effekt", facts.effects, "kind"));
  entries.push(...recordListEntries("Bedingung", facts.conditions, "kind"));
  if (facts.costProfile) entries.push({ label: "Kostenprofil", value: formatRecord(facts.costProfile), tone: "info" });
  if (facts.breakerProfile) entries.push({ label: "Breaker", value: formatRecord(facts.breakerProfile), tone: "info" });
  if (facts.remoteRole) entries.push({ label: "RemoteRole", value: formatRecord(facts.remoteRole), tone: "info" });
  entries.push(...recordListEntries("Target", facts.targetProfiles));
  return {
    key: "mechanical",
    title: "Mechanische Facts",
    emptyText: "Keine mechanischen Facts vorhanden.",
    entries,
  };
}

function functionSignalSection(inspector: CatalogAiInspector): AiInspectorSection {
  return {
    key: "functions",
    title: "Function-Signals",
    emptyText: "Keine Function-Signals abgeleitet.",
    entries: [
      ...stringEntries("Signal", inspector.functionSignals, "info"),
      ...stringEntries("Strategieanker", inspector.strategyAnchors, "valid"),
    ],
  };
}

function lineSupportSection(inspector: CatalogAiInspector): AiInspectorSection {
  return {
    key: "strategy",
    title: "Strategie / lineSupport",
    emptyText: "Kein lineSupport gesetzt.",
    entries: inspector.lineSupport.classification.map((entry) => classificationEntry("lineSupport", entry)),
  };
}

function strategicRoleSection(inspector: CatalogAiInspector): AiInspectorSection {
  return {
    key: "strategicRole",
    title: "Strategic Role",
    entries:
      inspector.strategicRole.length > 0
        ? stringEntries("StrategicRole", inspector.strategicRole, "valid")
        : [{ label: "StrategicRole", value: "nicht gesetzt", tone: "info" }],
  };
}

function qualitySection(inspector: CatalogAiInspector): AiInspectorSection {
  return {
    key: "quality",
    title: "Quality",
    emptyText: "Quality ist nicht gesetzt.",
    entries: inspector.quality ? keyValueEntries("Quality", inspector.quality, "info") : [],
  };
}

function legacyRoleSection(inspector: CatalogAiInspector): AiInspectorSection {
  return {
    key: "legacyRoles",
    title: "Legacy-Rollen",
    emptyText: "Keine Legacy-Rollen gesetzt.",
    entries: [
      ...inspector.legacyRoles.rolesClassification.map((entry) => classificationEntry("roles", entry)),
      ...inspector.legacyRoles.planRolesClassification.map((entry) => classificationEntry("planRoles", entry)),
    ],
  };
}

function warningSection(inspector: CatalogAiInspector): AiInspectorSection {
  const entries = [
    ...inspector.warnings.categories.map((category) => ({
      label: "Warning",
      value: formatAiInspectorLabel(category),
      tone: aiInspectorToneForCategory(category),
    })),
    ...inspector.warnings.descriptorGaps.map((gap) => ({
      label: "Descriptor-Gap",
      value: String(gap.gapId ?? "descriptor_gap"),
      ...(typeof gap.description === "string" ? { detail: gap.description } : {}),
      tone: "warning" as const,
    })),
  ];
  return {
    key: "warnings",
    title: "Warnings / Gaps / Legacy",
    emptyText: "Keine Warnings oder Gaps.",
    entries,
  };
}

function classificationEntry(field: string, entry: CatalogAiInspectorClassification): AiInspectorEntry {
  const mapsTo = entry.mapsTo.length > 0 ? ` -> ${entry.mapsTo.join(", ")}` : "";
  return {
    label: field,
    value: `${entry.value} [${entry.triageCategory}]${mapsTo}`,
    detail: entry.rationale,
    tone: aiInspectorToneForCategory(entry.triageCategory),
  };
}

function stringEntries(label: string, values: string[], tone: AiInspectorTone): AiInspectorEntry[] {
  return values.map((value) => ({ label, value, tone }));
}

function keyValueEntries(label: string, values: Record<string, unknown>, tone: AiInspectorTone): AiInspectorEntry[] {
  return Object.entries(values).map(([key, value]) => ({
    label,
    value: `${formatAiInspectorLabel(key)}: ${formatValue(value)}`,
    tone,
  }));
}

function recordListEntries(label: string, values: Array<Record<string, unknown>>, primaryKey?: string): AiInspectorEntry[] {
  return values.map((value) => {
    const primary = primaryKey && typeof value[primaryKey] === "string" ? String(value[primaryKey]) : label;
    const rest = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== primaryKey),
    );
    const detail = Object.keys(rest).length > 0 ? formatRecord(rest) : undefined;
    return {
      label,
      value: formatAiInspectorLabel(primary),
      ...(detail ? { detail } : {}),
      tone: "info" as const,
    };
  });
}

function formatRecord(record: Record<string, unknown>): string {
  return Object.entries(record)
    .map(([key, value]) => `${formatAiInspectorLabel(key)}: ${formatValue(value)}`)
    .join("; ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "nicht gesetzt";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return formatRecord(value as Record<string, unknown>);
  if (typeof value === "boolean") return value ? "ja" : "nein";
  return String(value);
}

function shortScenarioRef(value: string): string {
  return value.split("#").at(-1) ?? value;
}
