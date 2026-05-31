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
    label: "DeckDoctrine diagnostic";
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
