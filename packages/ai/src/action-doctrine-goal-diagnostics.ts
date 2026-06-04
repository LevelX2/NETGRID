import type {
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticSourceKind,
} from "./action-semantic-candidate";

export const DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION =
  "deck-doctrine-v2-diagnostic-schema-v1" as const;

export const DIAGNOSTIC_NO_EFFECT_FLAGS = {
  planner: false,
  actionScore: false,
  planWeight: false,
  targetingAi: false,
  engine: false,
  legality: false,
  profileOrDefaultSwitch: false,
  uiDerivation: false,
  hiddenInfoLeak: false,
} as const;

export type DiagnosticNoEffectFlags = typeof DIAGNOSTIC_NO_EFFECT_FLAGS;

export type DiagnosticFieldStatus =
  | "ready"
  | "partial"
  | "missing"
  | "blocked"
  | "not_applicable";

export type DeckDoctrineV2ReadinessStatus = "ready" | "partial" | "blocked";

export type DeckDoctrineV2DiagnosticFieldId =
  | "candidate_identity"
  | "projection_status"
  | "hidden_info_guard"
  | "source_card_context"
  | "ability_binding"
  | "strategy_support"
  | "conditions"
  | "risks"
  | "constraints"
  | "hard_gates";

export type DeckDoctrineV2DiagnosticField = {
  fieldId: DeckDoctrineV2DiagnosticFieldId;
  status: DiagnosticFieldStatus;
  evidence: string[];
  issues: ActionProjectionIssue[];
  notes: string[];
};

export type DeckDoctrineV2DiagnosticEntry = {
  actionId: string;
  actionType: string;
  actorSide: ActionSemanticCandidate["actorSide"];
  sourceKind: ActionSemanticSourceKind;
  primaryProjectionStatus: ActionSemanticCandidate["primaryProjectionStatus"];
  readinessStatus: DeckDoctrineV2ReadinessStatus;
  fields: DeckDoctrineV2DiagnosticField[];
  deckDoctrineGaps: string[];
  evidence: string[];
  sourceCardId?: string;
};

export type DeckDoctrineV2DiagnosticSummary = {
  totalCandidates: number;
  ready: number;
  partial: number;
  blocked: number;
  gapCategories: string[];
};

export type DeckDoctrineV2DiagnosticReadinessReport = {
  schemaVersion: typeof DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION;
  scope: "diagnostic_only";
  generatedFrom: "ActionSemanticCandidate";
  entries: DeckDoctrineV2DiagnosticEntry[];
  summary: DeckDoctrineV2DiagnosticSummary;
  noEffectFlags: DiagnosticNoEffectFlags;
};

export function buildDeckDoctrineV2DiagnosticReadinessReport(
  candidates: readonly ActionSemanticCandidate[],
): DeckDoctrineV2DiagnosticReadinessReport {
  const entries = candidates.map(buildDeckDoctrineV2DiagnosticEntry);

  return {
    schemaVersion: DECK_DOCTRINE_V2_DIAGNOSTIC_SCHEMA_VERSION,
    scope: "diagnostic_only",
    generatedFrom: "ActionSemanticCandidate",
    entries,
    summary: summarizeDeckDoctrineEntries(entries),
    noEffectFlags: DIAGNOSTIC_NO_EFFECT_FLAGS,
  };
}

function buildDeckDoctrineV2DiagnosticEntry(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticEntry {
  const fields = [
    field("candidate_identity", "ready", [
      candidate.actionId,
      candidate.actionType,
      candidate.actorSide,
    ]),
    projectionStatusField(candidate),
    hiddenInfoGuardField(candidate),
    sourceCardContextField(candidate),
    abilityBindingField(candidate),
    deckSupportArrayField(
      "strategy_support",
      candidate.sourceKind,
      candidate.strategySupport,
      candidate.strategySupport.map((support) => support.evidence),
    ),
    deckSupportArrayField(
      "conditions",
      candidate.sourceKind,
      candidate.conditions,
      candidate.conditions.flatMap((condition) => condition.evidence ?? []),
    ),
    deckSupportArrayField(
      "risks",
      candidate.sourceKind,
      candidate.risks,
      candidate.risks.flatMap((risk) => risk.evidence ?? []),
    ),
    deckSupportArrayField(
      "constraints",
      candidate.sourceKind,
      candidate.constraints,
      candidate.constraints.flatMap((constraint) => constraint.evidence ?? []),
    ),
    hardGatesField(candidate),
  ];
  const readinessStatus = readinessStatusForFields(fields);

  return {
    actionId: candidate.actionId,
    actionType: candidate.actionType,
    actorSide: candidate.actorSide,
    sourceKind: candidate.sourceKind,
    primaryProjectionStatus: candidate.primaryProjectionStatus,
    readinessStatus,
    fields,
    deckDoctrineGaps: deckDoctrineGaps(candidate, fields),
    evidence: [...candidate.evidence],
    ...(candidate.sourceCardId !== undefined
      ? { sourceCardId: candidate.sourceCardId }
      : {}),
  };
}

function projectionStatusField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return field(
      "projection_status",
      "blocked",
      [candidate.primaryProjectionStatus],
      [...candidate.projectionIssues],
      ["Projection is not usable for DeckDoctrine-v2 readiness."],
    );
  }
  if (
    candidate.primaryProjectionStatus === "partial_projected" ||
    candidate.primaryProjectionStatus === "schema_gap"
  ) {
    return field(
      "projection_status",
      "partial",
      [candidate.primaryProjectionStatus],
      [...candidate.projectionIssues],
      ["Projection remains partial and must stay diagnostic."],
    );
  }
  return field("projection_status", "ready", [candidate.primaryProjectionStatus]);
}

function hiddenInfoGuardField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  const hiddenInfoGate = candidate.hardGates.find(
    (gate) => gate.gateId === "hidden_info",
  );
  if (candidate.projectionIssues.includes("hidden_info_blocked")) {
    return field(
      "hidden_info_guard",
      "blocked",
      hiddenInfoGate?.evidence ?? [],
      ["hidden_info_blocked"],
      ["Hidden-info-sensitive fields are intentionally not projected."],
    );
  }
  if (hiddenInfoGate?.status === "pass") {
    return field(
      "hidden_info_guard",
      "ready",
      hiddenInfoGate.evidence ?? [],
      [],
      [hiddenInfoGate.reason ?? "Hidden-info gate passed."],
    );
  }
  return field(
    "hidden_info_guard",
    "partial",
    hiddenInfoGate?.evidence ?? [],
    [],
    [hiddenInfoGate?.reason ?? "Hidden-info guard is not fully evidenced."],
  );
}

function sourceCardContextField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (candidate.sourceKind !== "card") {
    return field(
      "source_card_context",
      "not_applicable",
      [candidate.sourceKind],
      [],
      ["Candidate is not card-sourced."],
    );
  }
  const sourceCardId = candidate.sourceCardId;
  const hasSourceCard = sourceCardId !== undefined;
  const hasCardSignals = candidate.cardContextSignals.length > 0;
  if (sourceCardId !== undefined && hasCardSignals) {
    return field(
      "source_card_context",
      "ready",
      [sourceCardId, ...candidate.cardContextSignals],
    );
  }
  return field(
    "source_card_context",
    hasSourceCard || hasCardSignals ? "partial" : "missing",
    [
      ...(candidate.sourceCardId !== undefined ? [candidate.sourceCardId] : []),
      ...candidate.cardContextSignals,
    ],
    candidate.projectionIssues.includes("card_semantics_unavailable")
      ? ["card_semantics_unavailable"]
      : [],
    ["Card source or card context signals are incomplete."],
  );
}

function abilityBindingField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  if (candidate.projectionIssues.includes("ability_unresolved")) {
    return field(
      "ability_binding",
      "partial",
      [candidate.abilityBindingMethod],
      ["ability_unresolved"],
      ["Ability binding is unresolved or ambiguous."],
    );
  }
  if (candidate.abilityId !== undefined) {
    return field("ability_binding", "ready", [
      candidate.abilityBindingMethod,
      candidate.abilityId,
    ]);
  }
  return field(
    "ability_binding",
    candidate.sourceKind === "card" ? "partial" : "not_applicable",
    [candidate.abilityBindingMethod],
    [],
    ["No side-safe ability id is present."],
  );
}

function deckSupportArrayField<T>(
  fieldId: Extract<
    DeckDoctrineV2DiagnosticFieldId,
    "strategy_support" | "conditions" | "risks" | "constraints"
  >,
  sourceKind: ActionSemanticSourceKind,
  values: readonly T[],
  evidence: readonly string[],
): DeckDoctrineV2DiagnosticField {
  if (sourceKind !== "card") {
    return field(
      fieldId,
      "not_applicable",
      [sourceKind],
      [],
      ["Candidate is not card-sourced."],
    );
  }
  if (values.length > 0) return field(fieldId, "ready", [...evidence]);
  return field(fieldId, "missing", [], [], [`${fieldId} is not projected.`]);
}

function hardGatesField(
  candidate: ActionSemanticCandidate,
): DeckDoctrineV2DiagnosticField {
  const blockingGate = candidate.hardGates.find(
    (gate) => gate.status === "block" || gate.severity === "error",
  );
  if (blockingGate !== undefined) {
    return field(
      "hard_gates",
      "blocked",
      blockingGate.evidence ?? [],
      [],
      [blockingGate.reason ?? `Gate blocked: ${blockingGate.gateId}`],
    );
  }
  const unknownGates = candidate.hardGates.filter(
    (gate) => gate.status === "unknown",
  );
  if (unknownGates.length > 0) {
    return field(
      "hard_gates",
      "partial",
      unknownGates.flatMap((gate) => gate.evidence ?? []),
      [],
      unknownGates.map((gate) => gate.reason ?? `Gate unknown: ${gate.gateId}`),
    );
  }
  return field(
    "hard_gates",
    "ready",
    candidate.hardGates.flatMap((gate) => gate.evidence ?? []),
  );
}

function readinessStatusForFields(
  fields: readonly DeckDoctrineV2DiagnosticField[],
): DeckDoctrineV2ReadinessStatus {
  if (fields.some((entry) => entry.status === "blocked")) return "blocked";
  if (
    fields.some(
      (entry) => entry.status === "partial" || entry.status === "missing",
    )
  ) {
    return "partial";
  }
  return "ready";
}

function deckDoctrineGaps(
  candidate: ActionSemanticCandidate,
  fields: readonly DeckDoctrineV2DiagnosticField[],
): string[] {
  return uniqueStrings([
    ...candidate.projectionIssues,
    ...fields
      .filter((entry) => entry.status === "partial" || entry.status === "missing")
      .map((entry) => `${entry.fieldId}_${entry.status}`),
  ]);
}

function summarizeDeckDoctrineEntries(
  entries: readonly DeckDoctrineV2DiagnosticEntry[],
): DeckDoctrineV2DiagnosticSummary {
  return {
    totalCandidates: entries.length,
    ready: entries.filter((entry) => entry.readinessStatus === "ready").length,
    partial: entries.filter((entry) => entry.readinessStatus === "partial")
      .length,
    blocked: entries.filter((entry) => entry.readinessStatus === "blocked")
      .length,
    gapCategories: uniqueStrings(
      entries.flatMap((entry) => entry.deckDoctrineGaps),
    ),
  };
}

function field(
  fieldId: DeckDoctrineV2DiagnosticFieldId,
  status: DiagnosticFieldStatus,
  evidence: readonly string[] = [],
  issues: readonly ActionProjectionIssue[] = [],
  notes: readonly string[] = [],
): DeckDoctrineV2DiagnosticField {
  return {
    fieldId,
    status,
    evidence: uniqueStrings(evidence),
    issues: [...issues],
    notes: [...notes],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
