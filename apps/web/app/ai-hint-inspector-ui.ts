export type AiInspectorTone =
  | "valid"
  | "warning"
  | "danger"
  | "info"
  | "legacy";

export type CatalogAiInspectorClassification = {
  value: string;
  category: string;
  triageCategory: string;
  mapsTo: string[];
  rationale: string;
};

export type CatalogStrategySupportPair = {
  strategyId: string;
  role?: string;
  roleDetail?: string;
  confidence?: string;
  evidence?: string[];
  sourceField?: string;
  sourceValue?: string;
  triageCategory?: string;
  rationale?: string;
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
  strategySupportPairs: CatalogStrategySupportPair[];
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
  description?: string;
  emptyText?: string;
  entries: AiInspectorEntry[];
};

const FORBIDDEN_RUNTIME_KEYS = [
  "GameState",
  "AIInput",
  "DecisionDebug",
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
  "actionScores",
  "planWeights",
];

const RUNTIME_LEGACY_NOTICE =
  "Hinweis: Legacy-Rollen werden intern noch teilweise von der KI verwendet.";
const LEGACY_MIGRATION_NOTICE =
  "Diese Felder gehören zum bisherigen KI-Pfad und werden noch nicht vollständig entfernt, solange Teile der KI darauf angewiesen sind. Sie sind nicht die neue Zielsemantik.";
const CARD_ROLE_MANIFEST_NOTICE =
  "`card-role-manifest-0.9` bleibt Runtime-/DeckDoctrine-Altbestand und ist nicht Teil der neuen Zielsemantik.";

export function aiInspectorSections(
  inspector: CatalogAiInspector,
): AiInspectorSection[] {
  return [
    tacticalSignalsSection(inspector),
    strategyAnchorSection(inspector),
    checkpointsSection(inspector),
    mechanicalDetailsSection(inspector),
    qualityDetailsSection(inspector),
    legacyMigrationSection(inspector),
  ];
}

export function defaultCollapsedAiInspectorSections(
  sections: AiInspectorSection[],
): Record<string, boolean> {
  const openByDefault = new Set([
    "tacticalSignals",
    "strategyAnchors",
    "checkpoints",
  ]);
  return Object.fromEntries(
    sections
      .filter((section) => !openByDefault.has(section.key))
      .map((section) => [section.key, true]),
  );
}

export function aiInspectorEntryKey(
  sectionKey: string,
  entry: AiInspectorEntry,
  index: number,
): string {
  return `${sectionKey}-${index}-${entry.label}-${entry.value ?? "empty"}`;
}

export function aiInspectorToneForCategory(category: string): AiInspectorTone {
  if (
    ["normalized_strategy_id", "exact_strategy_goal", "ai_supported"].includes(
      category,
    )
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
  if (category.includes("legacy")) return "legacy";
  if (
    category.includes("deferred") ||
    category.includes("descriptor_gap") ||
    category.includes("requires_card_review")
  ) {
    return "warning";
  }
  if (
    category.includes("alias") ||
    category.includes("function_signal") ||
    category.includes("fallback")
  ) {
    return "info";
  }
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

export function forbiddenInspectorFields(
  value: unknown,
  found = new Set<string>(),
): string[] {
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

function tacticalSignalsSection(
  inspector: CatalogAiInspector,
): AiInspectorSection {
  const entries = stringEntries(
    "Taktiksignal",
    inspector.functionSignals,
    "info",
  );
  if (entries.length === 0 && hasMechanicalDetails(inspector)) {
    entries.push({
      label: "Hinweis",
      value: "Keine Taktiksignale vorhanden",
      detail:
        "Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet.",
      tone: "warning",
    });
  }
  return {
    key: "tacticalSignals",
    title: "Taktiksignale",
    description: "Aus Kartenmechanik abgeleitete Funktionssignale.",
    emptyText: "Keine Taktiksignale vorhanden.",
    entries,
  };
}

function strategyAnchorSection(
  inspector: CatalogAiInspector,
): AiInspectorSection {
  const entries = mergedStrategyAnchorEntries(inspector);
  if (entries.length === 0) {
    entries.push({
      label: "Strategieanker",
      value: "Keine aktive Strategiezuordnung",
      tone: "info",
    });
  }
  return {
    key: "strategyAnchors",
    title: "Strategieanker",
    description:
      "Eindeutige Strategy Goals mit zugeordneten strategischen Rollen, wenn geprüfte Strategie/Rolle-Paare vorhanden sind.",
    entries,
  };
}

function qualityDetailsSection(
  inspector: CatalogAiInspector,
): AiInspectorSection {
  return {
    key: "qualityDetails",
    title: "Interne Qualität / Reviewdaten",
    description:
      "Interne Qualitäts- und Review-Metadaten aus dem compiled Hint.",
    emptyText: "Keine internen Qualität- oder Reviewdaten vorhanden.",
    entries: qualityEntries(inspector),
  };
}

function checkpointsSection(inspector: CatalogAiInspector): AiInspectorSection {
  const entries: AiInspectorEntry[] = [];
  const support = inspector.supportStatus;
  if (!support.compiledHintFound) {
    entries.push({
      label: "Missing compiled hint",
      value: "missing compiled hint",
      tone: "danger",
    });
  }
  entries.push(...qualityCheckpointEntries(inspector));
  if (support.mechanicalFactsFound && inspector.functionSignals.length === 0) {
    entries.push({
      label: "Taktiksignal-Lücke",
      value:
        "Mechanische Daten vorhanden, aber noch keine Taktiksignale abgeleitet",
      tone: "warning",
    });
  }
  for (const category of inspector.warnings.categories) {
    if (isLegacyNoticeCategory(category)) continue;
    const label = checkpointLabelForCategory(category);
    entries.push({
      label,
      value: formatAiInspectorLabel(category),
      tone: checkpointToneForLabel(label),
    });
  }
  for (const gap of inspector.warnings.descriptorGaps) {
    entries.push({
      label: "Descriptor-Gap",
      value: `Descriptor-Gap ${String(gap.gapId ?? "descriptor_gap")}`,
      ...(typeof gap.description === "string"
        ? { detail: gap.description }
        : {}),
      tone: "warning",
    });
  }
  if (support.legacyFallbackOnly) {
    entries.push({
      label: "Legacy / Migration",
      value: "Legacy-Fallback-only",
      detail: RUNTIME_LEGACY_NOTICE,
      tone: "legacy",
    });
  }
  const legacyCount = legacyDetailCount(inspector);
  if (legacyCount > 0) {
    entries.push({
      label: "Legacy / Migration",
      value: "Legacy-Daten vorhanden",
      detail: "Details unter Legacy / Migration.",
      tone: "legacy",
    });
  }
  return {
    key: "checkpoints",
    title: "Prüfpunkte",
    description:
      "Echte fachliche Prüfpunkte: Human Review, niedrige Confidence, Descriptor-Gaps, Missing compiled hint, Invalid/Hard Problem und kompakter Legacy-Hinweis.",
    emptyText: "Keine fachlichen Prüfpunkte.",
    entries,
  };
}

function mechanicalDetailsSection(
  inspector: CatalogAiInspector,
): AiInspectorSection {
  return {
    key: "mechanicalDetails",
    title: "Herleitung / mechanische Details",
    description:
      "Diese Daten zeigen, aus welchen regelnahen Karteninformationen die Taktiksignale abgeleitet wurden.",
    emptyText: "Keine mechanischen Details vorhanden.",
    entries: mechanicalDetailsEntries(inspector),
  };
}

function legacyMigrationSection(
  inspector: CatalogAiInspector,
): AiInspectorSection {
  const legacyCount = legacyDetailCount(inspector);
  const entries: AiInspectorEntry[] = [
    ...(legacyCount > 0
      ? [
          {
            label: "Hinweis",
            value: "bisheriger KI-Pfad",
            detail: LEGACY_MIGRATION_NOTICE,
            tone: "legacy" as const,
          },
          {
            label: "Runtime-Legacy",
            value: "KI nutzt Legacy teilweise",
            detail: RUNTIME_LEGACY_NOTICE,
            tone: "legacy" as const,
          },
          {
            label: "card-role-manifest",
            value: "Runtime-Legacy",
            detail: CARD_ROLE_MANIFEST_NOTICE,
            tone: "legacy" as const,
          },
        ]
      : []),
    ...compiledHintEntries(inspector),
    ...stringEntries("Legacy roles", inspector.legacyRoles.roles, "legacy"),
    ...stringEntries(
      "Legacy planRoles",
      inspector.legacyRoles.planRoles,
      "legacy",
    ),
    ...inactiveLineSupportEntries(inspector.lineSupport.classification),
    ...inspector.legacyRoles.rolesClassification.map((entry) =>
      classificationEntry("Legacy roles-Klassifikation", entry),
    ),
    ...inspector.legacyRoles.planRolesClassification.map((entry) =>
      classificationEntry("Legacy planRoles-Klassifikation", entry),
    ),
    ...inspector.warnings.categories.map((category) => ({
      label: "Hinweis-Kategorie",
      value: formatAiInspectorLabel(category),
      tone: aiInspectorToneForCategory(category),
    })),
    ...keyValueEntries(
      "Legacy-Status",
      inspector.warnings.legacyStatus,
      "legacy",
    ),
    ...keyValueEntries(
      "StrategicRole-Status",
      inspector.warnings.strategicRoleStatus,
      "legacy",
    ),
  ];
  return {
    key: "legacyDetails",
    title: "Legacy / Migration / Entwicklerdetails",
    description:
      "Altbestand, Migration und Debug: zeigt roles, planRoles, Legacy-lineSupport, Alias-/Migrationsklassifikationen und alte Rohkategorien ohne neue Zielsemantik.",
    emptyText: "Keine Legacy-, Migrations- oder Entwicklerdetails vorhanden.",
    entries,
  };
}

function compiledHintEntries(
  inspector: CatalogAiInspector,
): AiInspectorEntry[] {
  const hint = inspector.compiledHint;
  const entries: AiInspectorEntry[] = [
    {
      label: "Quelle",
      value: String(inspector.source.compiledHintsPath ?? "compiled hint"),
      tone: "info",
    },
  ];
  if (!hint) {
    entries.push({
      label: "Compiled Hint",
      value: "nicht vorhanden",
      tone: "danger",
    });
    return entries;
  }
  entries.push(...stringEntries("Mechaniken", hint.requiredMechanics, "info"));
  entries.push(...keyValueEntries("Werte", hint.valueHints, "info"));
  entries.push(...stringEntries("Risiken", hint.riskTags, "warning"));
  entries.push(
    ...stringEntries(
      "Szenarien",
      hint.scenarioRefs.map(shortScenarioRef),
      "info",
    ),
  );
  entries.push(...stringEntries("Manual Notes", hint.manualNotes, "legacy"));
  entries.push(
    ...stringEntries("Strategic Notes", hint.strategicNotes, "legacy"),
  );
  entries.push(
    ...stringEntries("Overlay", inspector.supportStatus.overlayFields, "info"),
  );
  return entries;
}

function mechanicalFactEntries(
  inspector: CatalogAiInspector,
): AiInspectorEntry[] {
  const facts = inspector.mechanicalFacts;
  const entries: AiInspectorEntry[] = [];
  if (!facts) return entries;
  entries.push(...recordListEntries("effects", facts.effects, "kind"));
  entries.push(...recordListEntries("conditions", facts.conditions, "kind"));
  if (facts.costProfile)
    entries.push({
      label: "costProfile",
      value: formatRecord(facts.costProfile),
      tone: "info",
    });
  if (facts.breakerProfile)
    entries.push({
      label: "breakerProfile",
      value: formatRecord(facts.breakerProfile),
      tone: "info",
    });
  if (facts.remoteRole)
    entries.push({
      label: "remoteRole",
      value: formatRecord(facts.remoteRole),
      tone: "info",
    });
  entries.push(...recordListEntries("targetProfiles", facts.targetProfiles));
  return entries;
}

function mechanicalDetailsEntries(
  inspector: CatalogAiInspector,
): AiInspectorEntry[] {
  const entries = mechanicalFactEntries(inspector);
  const compiledHintsPath = inspector.source.compiledHintsPath;
  if (typeof compiledHintsPath === "string") {
    entries.push({
      label: "Compiled source",
      value: compiledHintsPath,
      tone: "info",
    });
  }
  return entries;
}

function classificationEntry(
  field: string,
  entry: CatalogAiInspectorClassification,
): AiInspectorEntry {
  const isSelfMapping =
    entry.mapsTo.length === 1 && entry.mapsTo[0] === entry.value;
  const classification =
    entry.triageCategory === "normalized_strategy_id"
      ? ""
      : ` [${entry.triageCategory}]`;
  const mapsTo =
    entry.mapsTo.length > 0 && !isSelfMapping
      ? ` -> ${entry.mapsTo.join(", ")}`
      : "";
  return {
    label: field,
    value: `${entry.value}${classification}${mapsTo}`,
    detail: entry.rationale,
    tone: aiInspectorToneForCategory(entry.triageCategory),
  };
}

function mergedStrategyAnchorEntries(
  inspector: CatalogAiInspector,
): AiInspectorEntry[] {
  const sources = new Map<
    string,
    { derived: boolean; lineSupport: boolean; strategySupportPair: boolean }
  >();
  for (const strategyId of inspector.strategyAnchors) {
    sources.set(strategyId, {
      ...(sources.get(strategyId) ?? {
        derived: false,
        lineSupport: false,
        strategySupportPair: false,
      }),
      derived: true,
    });
  }
  for (const entry of inspector.lineSupport.classification) {
    if (!isActiveLineSupport(entry)) continue;
    sources.set(entry.value, {
      ...(sources.get(entry.value) ?? {
        derived: false,
        lineSupport: false,
        strategySupportPair: false,
      }),
      lineSupport: true,
    });
  }
  const pairsByStrategy = strategySupportPairsByStrategy(
    inspector.strategySupportPairs,
  );
  for (const strategyId of pairsByStrategy.keys()) {
    sources.set(strategyId, {
      ...(sources.get(strategyId) ?? {
        derived: false,
        lineSupport: false,
        strategySupportPair: false,
      }),
      strategySupportPair: true,
    });
  }
  const entries = [...sources.entries()].flatMap(([strategyId, source]) => {
    const anchorEntries: AiInspectorEntry[] = [
      {
        label: "Strategieanker",
        value: strategyId,
        detail: `Quelle: ${strategyAnchorSourceLabel(source)}`,
        tone: "valid" as const,
      },
    ];
    for (const pair of pairsByStrategy.get(strategyId) ?? []) {
      if (!pair.role) continue;
      anchorEntries.push({
        label: "Strategische Rolle",
        value: pair.role,
        detail: strategySupportPairDetail(pair),
        tone: "valid" as const,
      });
    }
    return anchorEntries;
  });
  if (sources.size > 0 && !hasExplicitStrategySupportPairRoles(inspector)) {
    for (const role of validStrategicRoles(inspector)) {
      entries.push({
        label: "Strategische Rolle (Fallback)",
        value: role,
        detail:
          "Noch nicht als geprüftes Strategie/Rolle-Paar am einzelnen Strategieanker gespeichert.",
        tone: "legacy",
      });
    }
  }
  return entries;
}

function strategyAnchorSourceLabel(source: {
  derived: boolean;
  lineSupport: boolean;
  strategySupportPair: boolean;
}): string {
  const parts = [];
  if (source.strategySupportPair) parts.push("Strategie/Rolle-Paar");
  if (source.derived) parts.push("abgeleitet");
  if (source.lineSupport) parts.push("lineSupport");
  if (parts.length > 0) return parts.join(" + ");
  return "unbekannt";
}

function strategySupportPairsByStrategy(
  pairs: CatalogStrategySupportPair[],
): Map<string, CatalogStrategySupportPair[]> {
  const groups = new Map<string, CatalogStrategySupportPair[]>();
  for (const pair of pairs) {
    if (!pair.strategyId || pair.sourceField !== "strategySupportPairs")
      continue;
    const group = groups.get(pair.strategyId) ?? [];
    group.push(pair);
    groups.set(pair.strategyId, group);
  }
  return groups;
}

function strategySupportPairDetail(pair: CatalogStrategySupportPair): string {
  return [
    `zugeordnet zu ${pair.strategyId}`,
    pair.roleDetail ? `Feinrolle: ${pair.roleDetail}` : undefined,
    pair.confidence ? `Confidence: ${pair.confidence}` : undefined,
    pair.evidence && pair.evidence.length > 0
      ? `Evidence: ${pair.evidence.join(", ")}`
      : undefined,
    pair.rationale,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("; ");
}

function hasExplicitStrategySupportPairRoles(
  inspector: CatalogAiInspector,
): boolean {
  return inspector.strategySupportPairs.some(
    (pair) =>
      pair.sourceField === "strategySupportPairs" &&
      typeof pair.role === "string",
  );
}

function inactiveLineSupportEntries(
  classification: CatalogAiInspectorClassification[],
): AiInspectorEntry[] {
  return classification
    .filter((entry) => !isActiveLineSupport(entry))
    .map((entry) => classificationEntry("Legacy-lineSupport", entry));
}

function isActiveLineSupport(entry: CatalogAiInspectorClassification): boolean {
  return entry.triageCategory === "normalized_strategy_id";
}

function qualityEntries(inspector: CatalogAiInspector): AiInspectorEntry[] {
  return inspector.quality
    ? keyValueEntries("Reviewdaten", inspector.quality, "info")
    : [];
}

function qualityCheckpointEntries(
  inspector: CatalogAiInspector,
): AiInspectorEntry[] {
  const quality = inspector.quality;
  const entries: AiInspectorEntry[] = [];
  if (!quality) return entries;
  if (quality.needsHumanReview === true) {
    entries.push({
      label: "Human Review",
      value: "needs_human_review",
      tone: "warning",
    });
  }
  if (quality.confidence === "low") {
    entries.push({
      label: "Confidence low",
      value: "confidence low",
      tone: "warning",
    });
  }
  return entries;
}

function validStrategicRoles(inspector: CatalogAiInspector): string[] {
  const statusValidValues = stringArrayField(
    inspector.warnings.strategicRoleStatus,
    "validValues",
  );
  if (statusValidValues.length > 0) return statusValidValues;
  if (
    Object.prototype.hasOwnProperty.call(
      inspector.warnings.strategicRoleStatus,
      "validValues",
    )
  )
    return [];
  return inspector.strategicRole;
}

function stringArrayField(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function checkpointLabelForCategory(category: string): string {
  if (category.includes("missing")) return "Missing compiled hint";
  if (
    category.includes("invalid") ||
    category.includes("hard") ||
    category.includes("wrong_side")
  )
    return "Invalid / Hard Problem";
  if (
    category.includes("deferred") ||
    category.includes("human_review") ||
    category.includes("requires_card_review")
  ) {
    return "Deferred / Human Review";
  }
  if (category.includes("descriptor_gap")) return "Descriptor-Gap";
  return "Info";
}

function checkpointToneForLabel(label: string): AiInspectorTone {
  if (label === "Missing compiled hint" || label === "Invalid / Hard Problem")
    return "danger";
  if (label === "Deferred / Human Review" || label === "Descriptor-Gap")
    return "warning";
  return "info";
}

function isLegacyNoticeCategory(category: string): boolean {
  return category.includes("legacy") || category.includes("fallback");
}

function legacyDetailCount(inspector: CatalogAiInspector): number {
  return (
    inspector.legacyRoles.roles.length +
    inspector.legacyRoles.planRoles.length +
    inspector.legacyRoles.rolesClassification.length +
    inspector.legacyRoles.planRolesClassification.length +
    inspector.lineSupport.classification.filter(
      (entry) => !isActiveLineSupport(entry),
    ).length +
    inspector.warnings.categories.filter(isLegacyNoticeCategory).length +
    Object.keys(inspector.warnings.legacyStatus).length
  );
}

function hasMechanicalDetails(inspector: CatalogAiInspector): boolean {
  const facts = inspector.mechanicalFacts;
  return Boolean(
    facts &&
    (facts.effects.length > 0 ||
      facts.conditions.length > 0 ||
      facts.costProfile ||
      facts.breakerProfile ||
      facts.remoteRole ||
      facts.targetProfiles.length > 0),
  );
}

function stringEntries(
  label: string,
  values: string[],
  tone: AiInspectorTone,
): AiInspectorEntry[] {
  return values.map((value) => ({ label, value, tone }));
}

function keyValueEntries(
  label: string,
  values: Record<string, unknown>,
  tone: AiInspectorTone,
): AiInspectorEntry[] {
  return Object.entries(values).map(([key, value]) => ({
    label,
    value: `${formatAiInspectorLabel(key)}: ${formatValue(value)}`,
    tone,
  }));
}

function recordListEntries(
  label: string,
  values: Array<Record<string, unknown>>,
  primaryKey?: string,
): AiInspectorEntry[] {
  return values.map((value) => {
    const primary =
      primaryKey && typeof value[primaryKey] === "string"
        ? String(value[primaryKey])
        : label;
    const rest = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== primaryKey),
    );
    const detail =
      Object.keys(rest).length > 0 ? formatRecord(rest) : undefined;
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
    .map(
      ([key, value]) => `${formatAiInspectorLabel(key)}: ${formatValue(value)}`,
    )
    .join("; ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "nicht gesetzt";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object")
    return formatRecord(value as Record<string, unknown>);
  if (typeof value === "boolean") return value ? "ja" : "nein";
  return String(value);
}

function shortScenarioRef(value: string): string {
  return value.split("#").at(-1) ?? value;
}
