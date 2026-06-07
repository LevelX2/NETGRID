export type DeckStrategyViewerSide = "runner" | "corp";

export type DeckStrategyProfileTone = "valid" | "warning" | "danger" | "info" | "legacy";

export type DeckStrategyProfileStrategyStatus =
  | "primary"
  | "secondary"
  | "low"
  | "unsupported";

export type DeckStrategyProfileEntry = {
  label: string;
  value: string;
  detail?: string;
  tone: DeckStrategyProfileTone;
};

export type DeckStrategyProfileSection = {
  key: string;
  title: string;
  entries: DeckStrategyProfileEntry[];
  emptyText?: string;
};

export type DeckStrategyProfileScoreSet = {
  anchorScore: number;
  supportScore: number;
  finalScore: number;
};

export type DeckStrategyProfileStrategyRow = DeckStrategyProfileScoreSet & {
  strategyId: string;
  label: string;
  description?: string;
  confidence: string;
  status: DeckStrategyProfileStrategyStatus;
  evidenceCount: number;
  gapCount: number;
};

export type DeckStrategyProfileAnchorEvidence = {
  cardId: string;
  cardTitle: string;
  quantity: number;
  source: string;
  signal?: string;
  role?: string;
  reason: string;
};

export type DeckStrategyProfileSupportEvidence = {
  signal: string;
  category: string;
  count: number;
  exampleCards: string[];
  sources: string[];
};

export type DeckStrategyProfileGap = {
  gapName: string;
  strategyId: string;
  tone: DeckStrategyProfileTone;
};

export type DeckStrategyProfileEvidenceGroup = {
  strategyId: string;
  label: string;
  description?: string;
  anchorEvidence: DeckStrategyProfileAnchorEvidence[];
  supportEvidence: DeckStrategyProfileSupportEvidence[];
  supportGaps: DeckStrategyProfileGap[];
};

export type DeckStrategyProfileRunnerStrategicIntentViewer = {
  schemaVersion: "runner-strategic-intent-profile-v1";
  title: "Abgeleitete KI-Spielabsicht";
  notice: string;
  source: {
    label: "Abgeleitete KI-Spielabsicht";
    interpretation: "Runtime-nahe Projektion";
    deckStrategyProfile: "diagnostic_only";
    deckCapabilities: "ai_internal";
    plannerEffect: "runtime_projection";
  };
  statusEntries: DeckStrategyProfileEntry[];
  sections: DeckStrategyProfileSection[];
  evidence: DeckStrategyProfileEntry[];
};

export type DeckStrategyProfileNotice = {
  label: string;
  value: string;
  tone: DeckStrategyProfileTone;
};

export type DeckStrategyProfileViewer = {
  schemaVersion: "ai007-deck-strategy-viewer-v1";
  taskId: "AI007";
  deckId: string;
  deckName: string;
  side: DeckStrategyViewerSide;
  cardCount: number;
  statusEntries: DeckStrategyProfileEntry[];
  source: {
    label: "Diagnostisches KI-Deckprofil";
    aggregation: "AI006 strategy aggregation";
    profileSchemaVersion: string;
    profileTaskId: string;
    plannerEffect: "none";
    deckHash?: string;
  };
  diagnosticNotice: string;
  primaryStrategies: string[];
  secondaryStrategies: string[];
  strategies: DeckStrategyProfileStrategyRow[];
  sideProfileTitle: string;
  sideProfileGroups: DeckStrategyProfileSection[];
  evidenceGroups: DeckStrategyProfileEvidenceGroup[];
  runnerStrategicIntent?: DeckStrategyProfileRunnerStrategicIntentViewer;
  functionSignalCounts: DeckStrategyProfileEntry[];
  legacySignalGroups: DeckStrategyProfileSection[];
  warnings: DeckStrategyProfileNotice[];
};

export type DeckStrategyProfileUnavailableDeckInfo = {
  deckId?: string;
  deckName?: string;
  side?: DeckStrategyViewerSide;
  cardCount?: number;
};

export type DeckStrategyProfileViewerResponse =
  | {
      schemaVersion: "ai007-deck-strategy-viewer-response-v1";
      taskId: "AI007";
      status: "available";
      viewer: DeckStrategyProfileViewer;
    }
  | {
      schemaVersion: "ai007-deck-strategy-viewer-response-v1";
      taskId: "AI007";
      status: "unavailable";
      reason: string;
      deck?: DeckStrategyProfileUnavailableDeckInfo;
    };

export const DECK_STRATEGY_PROFILE_JSON_EXPORT_SCHEMA_VERSION =
  "ai007-deck-strategy-json-export-v1" as const;

export type DeckStrategyProfileJsonExport = {
  schemaVersion: typeof DECK_STRATEGY_PROFILE_JSON_EXPORT_SCHEMA_VERSION;
  taskId: "AI007";
  exportKind: "diagnostic_ai_deck_profile";
  exportedAt: string;
  plannerEffect: "none";
  deck: {
    deckId: string;
    deckName: string;
    side: DeckStrategyViewerSide;
    cardCount: number;
    deckHash?: string;
  };
  safety: {
    payload: "deck_strategy_profile_viewer_only";
    forbiddenFields: [];
  };
  viewer: DeckStrategyProfileViewer;
};

export const FORBIDDEN_DECK_STRATEGY_VIEWER_FIELDS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullGameState",
  "fullState",
  "stateSnapshots",
  "undoSnapshots",
  "legalActions",
  "playerActions",
  "stateVersion",
  "stateHash",
  "actionId",
  "actionScores",
  "actionScore",
  "planWeights",
  "PlanWeights",
];

export function deckStrategyProfileJsonExport(
  viewer: DeckStrategyProfileViewer,
  exportedAt = new Date().toISOString(),
): DeckStrategyProfileJsonExport {
  const payload: DeckStrategyProfileJsonExport = {
    schemaVersion: DECK_STRATEGY_PROFILE_JSON_EXPORT_SCHEMA_VERSION,
    taskId: "AI007",
    exportKind: "diagnostic_ai_deck_profile",
    exportedAt,
    plannerEffect: "none",
    deck: {
      deckId: viewer.deckId,
      deckName: viewer.deckName,
      side: viewer.side,
      cardCount: viewer.cardCount,
      ...(viewer.source.deckHash ? { deckHash: viewer.source.deckHash } : {}),
    },
    safety: {
      payload: "deck_strategy_profile_viewer_only",
      forbiddenFields: [],
    },
    viewer,
  };
  const forbiddenFields = forbiddenDeckStrategyFields(payload);
  if (forbiddenFields.length > 0) {
    throw new Error(`Deck strategy profile export contains forbidden fields: ${forbiddenFields.join(", ")}`);
  }
  return payload;
}

export function serializeDeckStrategyProfileJsonExport(
  viewer: DeckStrategyProfileViewer,
  exportedAt?: string,
): string {
  return `${JSON.stringify(deckStrategyProfileJsonExport(viewer, exportedAt), null, 2)}\n`;
}

export function deckStrategyProfileJsonExportFileName(
  viewer: Pick<DeckStrategyProfileViewer, "deckName" | "deckId" | "side">,
): string {
  const deckName = safeDeckStrategyProfileFileNamePart(viewer.deckName || viewer.deckId);
  return `netgrid-ki-deckprofil-${viewer.side}-${deckName}.json`;
}

export function deckStrategyProfileEntryKey(
  sectionKey: string,
  entry: DeckStrategyProfileEntry,
  index: number,
): string {
  return `${sectionKey}-${index}-${entry.label}-${entry.value}`;
}

export function deckStrategyEvidenceKey(
  strategyId: string,
  source: string,
  value: string,
  index: number,
): string {
  return `${strategyId}-${source}-${index}-${value}`;
}

export function strategyStatusLabel(status: DeckStrategyProfileStrategyStatus): string {
  switch (status) {
    case "primary":
      return "Primär";
    case "secondary":
      return "Sekundär";
    case "low":
      return "Niedrig";
    case "unsupported":
      return "Nicht unterstützt";
  }
}

export function strategyStatusTone(
  status: DeckStrategyProfileStrategyStatus,
): DeckStrategyProfileTone {
  switch (status) {
    case "primary":
    case "secondary":
      return "valid";
    case "low":
      return "info";
    case "unsupported":
      return "legacy";
  }
}

export function scoreWidthPercent(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function formatStrategyScore(value: number): string {
  return String(Math.max(0, Math.min(100, Math.round(value))));
}

export function formatStrategyLabel(value: string): string {
  const withoutSide = value.replace(/^(runner|corp)\./, "");
  return withoutSide
    .split(/[_\-.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatRunnerStrategicIntentValue(value: string): string {
  switch (value) {
    case "runner.steal_agendas_default":
      return "Agenda-Steal";
    case "runner.unknown":
      return "Unklare Runner-Spielabsicht";
    case "runner.run_event_tempo":
      return "Run-Event-Tempo";
    case "runner.opportunistic_pressure":
      return "Opportunistischer Druck";
    case "runner.setup_first":
      return "Setup zuerst";
    case "runner.search.breaker":
    case "runner.search_breaker_setup":
      return "Breaker-Suche";
    case "runner.rig_first":
      return "Rig-Aufbau";
    case "runner.economy_first":
    case "runner.economy_setup_before_pressure":
      return "Economy-Aufbau vor Druck";
    case "runner.draw_or_search_setup":
      return "Draw-/Search-Setup";
    case "runner.central_probe_pressure":
      return "Zentraler Probe-/Access-Druck";
    case "runner.hq_pressure":
      return "HQ-Druck";
    case "runner.rnd_pressure":
      return "R&D-Druck";
    case "runner.remote_contest":
      return "Remote Contest";
    case "runner.remote_trash":
      return "Remote Trash-Druck";
    case "runner.conditional_remote_contest":
      return "Situativer Remote Contest";
    case "runner.risky_universal_breaker_pressure":
      return "Riskante Universalbreaker-Coverage";
    case "runner.low_confidence_strategy_projection":
      return "Niedrige Projektionssicherheit";
    case "runner.hq_depletion":
      return "HQ-Depletion-Muster";
    case "runner.bad_publicity_pressure":
      return "Bad-Publicity-Druckmuster";
    case "runner.dedicated_rnd_multiaccess":
      return "Dediziertes R&D-Multiaccess-Muster";
    case "runner.dedicated_hq_multiaccess":
      return "Dediziertes HQ-Multiaccess-Muster";
    default:
      return formatStrategyLabel(value);
  }
}

export function formatDeckStrategyValue(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

export function containsForbiddenDeckStrategyField(value: unknown): boolean {
  return forbiddenDeckStrategyFields(value).length > 0;
}

export function forbiddenDeckStrategyFields(value: unknown, found = new Set<string>()): string[] {
  if (value === null || typeof value !== "object") return [...found].sort();
  if (Array.isArray(value)) {
    for (const item of value) forbiddenDeckStrategyFields(item, found);
    return [...found].sort();
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_DECK_STRATEGY_VIEWER_FIELDS.includes(key)) found.add(key);
    forbiddenDeckStrategyFields(child, found);
  }
  return [...found].sort();
}

function safeDeckStrategyProfileFileNamePart(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/ß/g, "ss")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return normalized || "deck";
}
