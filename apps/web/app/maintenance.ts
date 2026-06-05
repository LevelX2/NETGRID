export type MaintenanceParticipant = {
  side: "runner" | "corp";
  displayName: string;
  connected: boolean;
  lastSeenAt: string;
};

export type MaintenanceMatchSizes = {
  matchRecordBytes: number;
  gameStateBytes: number;
  eventPayloadBytes: number;
  stateSnapshotBytes: number;
  deckSnapshotBytes: number;
  approximateTotalBytes: number;
};

export type MaintenanceMatchEntry = {
  matchId: string;
  status: string;
  terminal: boolean;
  mode: string;
  retentionProtected: boolean;
  retentionProtectedAt?: string;
  matchVersion: number;
  stateVersion?: number;
  stateHash?: string;
  createdAt: string;
  updatedAt: string;
  ageSeconds: number;
  participants: MaintenanceParticipant[];
  eventCount: number;
  snapshotCount: number;
  sizes: MaintenanceMatchSizes;
};

export type MaintenanceTableSize = {
  key: string;
  label: string;
  rowCount: number;
  approximatePayloadBytes: number;
};

export type MaintenanceSummary = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  database: {
    fileName: string;
    fileSizeBytes: number;
    pageSize: number;
    pageCount: number;
    freelistCount: number;
  };
  schemaVersion: number;
  storageFormat: string;
  matchCount: number;
  terminalCount: number;
  nonTerminalCount: number;
  matchCountsByStatus: Record<string, number>;
  matchCountsByMode: Record<string, number>;
  oldestMatchCreatedAt?: string;
  newestMatchUpdatedAt?: string;
  tableSizes: MaintenanceTableSize[];
  largestMatches: MaintenanceMatchEntry[];
};

export type MaintenanceMatchDetail = MaintenanceMatchEntry & {
  tableRows: {
    events: number;
    stateSnapshots: number;
    actionReceipts: number;
    undoSnapshots: number;
    pendingUndo: number;
    startLobbies: number;
    deckSnapshotsRedacted: number;
    aiDecisionTraces?: number;
  };
  cleanupAssessment: {
    eligibleInReadOnlySlice: false;
    recommendation: "not_active";
    reason: string;
  };
};

export type MaintenanceAiTraceMatchEntry = {
  matchId: string;
  status: string;
  mode: string;
  aiTraceMode: "summary" | "detailed";
  traceCount: number;
  createdAt: string;
  updatedAt: string;
  firstTraceAt?: string;
  lastTraceAt?: string;
};

export type MaintenanceAiTraceIndexEntry = {
  traceId: string;
  matchId: string;
  eventId: string;
  stateVersion: number;
  matchVersion: number;
  side: "runner" | "corp";
  turn: number;
  decisionIndex: number;
  selectedActionId?: string;
  selectedActionType?: string;
  planKind?: string;
  score?: number;
  confidence?: number;
  createdAt: string;
  schemaVersion: string;
  meta: Record<string, unknown>;
};

export type MaintenanceAiTraceDetail = MaintenanceAiTraceIndexEntry & {
  detail: Record<string, unknown>;
};

export type MaintenanceAiTraceActionRow = {
  key: string;
  rank: number;
  label: string;
  selected: boolean;
  debugSelected: boolean;
  excluded: boolean;
  source: string;
  priority: string;
  metrics: string[];
  scoreRows: Array<[string, string]>;
  reason: string;
};

export type MaintenanceRecoveryAccess = {
  matchId: string;
  side: "runner" | "corp";
  access: string;
  displayName: string;
  webSocketUrl: string;
  matchStatus: string;
  matchVersion: number;
  issuedAt: string;
};

export type MaintenanceCleanupFilters = {
  statuses: string[];
  olderThanMinutes: string;
  limit: string;
  vacuumAfter: boolean;
  createBackup: boolean;
  includeProtected: boolean;
};

export type MaintenanceCleanupRequest = {
  statuses: string[];
  olderThanMinutes: number;
  limit: number;
  includeProtected: boolean;
};

export type MaintenanceCleanupPolicy = {
  backendOpsVersion: "Backend 0.5";
  enabled: boolean;
  statuses: string[];
  olderThanDays: number;
  limit?: number;
  includeProtected?: boolean;
  vacuumAfter?: boolean;
  createBackup?: boolean;
  intervalMinutes: 60;
  updatedAt?: string;
  lastRun?: {
    startedAt: string;
    finishedAt: string;
    matchedCount: number;
    deletedCount: number;
    approximateBytes: number;
    backupCreated: boolean;
    backupId?: string;
    skippedReason?: string;
    errorCode?: string;
  };
};

export type MaintenanceCleanupPreview = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  previewId: string;
  filters: MaintenanceCleanupRequest;
  matchCount: number;
  statusCounts: Record<string, number>;
  approximateBytes: number;
  oldestUpdatedAt?: string;
  newestUpdatedAt?: string;
  matches: MaintenanceMatchEntry[];
  warnings: string[];
};

export type MaintenanceCleanupApplyResult = {
  backendOpsVersion: "Backend 0.5";
  generatedAt: string;
  previewId: string;
  filters: MaintenanceCleanupRequest;
  deletedCount: number;
  deletedMatchIds: string[];
  approximateBytes: number;
  backup?: {
    backupDir: string;
    backupId: string;
    createdAt: string;
  };
  backupCreated: boolean;
  integrityCheck: "ok";
  vacuum: {
    requested: boolean;
    performed: boolean;
  };
  database: {
    beforeBytes: number;
    afterDeleteBytes: number;
    afterVacuumBytes?: number;
  };
};

export type MaintenanceFilters = {
  status: string;
  terminal: "all" | "true" | "false";
  mode: string;
  olderThanDays: string;
  largerThanMiB: string;
  limit: string;
};

export const EMPTY_MAINTENANCE_FILTERS: MaintenanceFilters = {
  status: "",
  terminal: "all",
  mode: "",
  olderThanDays: "",
  largerThanMiB: "",
  limit: "50"
};

export const DEFAULT_MAINTENANCE_CLEANUP_FILTERS: MaintenanceCleanupFilters = {
  statuses: ["active"],
  olderThanMinutes: "60",
  limit: "100",
  vacuumAfter: false,
  createBackup: false,
  includeProtected: false
};

export function resolveMaintenanceServerHttp(configuredServerHttp: string, pageHostname?: string): string {
  const configured = configuredServerHttp.trim() || "http://127.0.0.1:8787";
  const hostname = pageHostname?.toLowerCase();
  if (hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]") {
    return "http://127.0.0.1:8787";
  }
  return configured;
}

const SENSITIVE_MARKERS = [
  /sessionToken/i,
  /reconnectToken/i,
  /joinToken/i,
  /tokenHash/i,
  /cardInstances/i,
  /privatePayload/i,
  /privateDeckSnapshots/i,
  /decklist/i,
  /fullState/i,
  /game_state_json/i,
  /AIInput/i,
  /DecisionDebug/i,
  /decisionDebug/i,
  /C:\\Users/i
];

export function buildMaintenanceMatchQuery(filters: MaintenanceFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.terminal !== "all") params.set("terminal", filters.terminal);
  if (filters.mode) params.set("mode", filters.mode);
  const olderThanDays = Number(filters.olderThanDays);
  if (Number.isFinite(olderThanDays) && olderThanDays > 0) params.set("olderThanDays", String(Math.floor(olderThanDays)));
  const largerThanMiB = Number(filters.largerThanMiB);
  if (Number.isFinite(largerThanMiB) && largerThanMiB > 0) params.set("largerThanBytes", String(Math.floor(largerThanMiB * 1024 * 1024)));
  const limitText = filters.limit.trim();
  if (limitText === "") {
    params.set("limit", "all");
  } else {
    const limit = Number(limitText);
    if (Number.isFinite(limit) && limit > 0) params.set("limit", String(Math.floor(limit)));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildMaintenanceCleanupRequest(filters: MaintenanceCleanupFilters): MaintenanceCleanupRequest {
  const olderThanMinutes = Number(filters.olderThanMinutes);
  const limit = Number(filters.limit);
  return {
    statuses: [...new Set(filters.statuses)].filter(Boolean),
    olderThanMinutes: Number.isFinite(olderThanMinutes) && olderThanMinutes > 0 ? Math.floor(olderThanMinutes) : 60,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(500, Math.floor(limit)) : 100,
    includeProtected: filters.includeProtected
  };
}

export function buildMaintenanceRecoveryLink(access: Pick<MaintenanceRecoveryAccess, "matchId" | "side" | "access">, webOrigin: string): string {
  const url = new URL("/", webOrigin);
  url.searchParams.set("matchId", access.matchId);
  url.searchParams.set("side", access.side);
  url.searchParams.set("reconnectToken", access.access);
  return url.toString();
}

export function buildMaintenanceAiTraceIndexPath(matchId: string, afterDecisionIndex?: number): string {
  const path = `/api/storage/maintenance/ai-decision-traces/matches/${encodeURIComponent(matchId)}`;
  if (afterDecisionIndex === undefined || !Number.isFinite(afterDecisionIndex)) return path;
  return `${path}?afterDecisionIndex=${Math.max(0, Math.floor(afterDecisionIndex))}`;
}

export function buildMaintenanceAiTraceEnablePath(matchId: string): string {
  return `/api/storage/maintenance/ai-decision-traces/matches/${encodeURIComponent(matchId)}/enable`;
}

export function mergeMaintenanceAiTraceIndex(current: MaintenanceAiTraceIndexEntry[], incoming: MaintenanceAiTraceIndexEntry[]): MaintenanceAiTraceIndexEntry[] {
  const byId = new Map<string, MaintenanceAiTraceIndexEntry>();
  for (const trace of current) byId.set(trace.traceId, trace);
  for (const trace of incoming) byId.set(trace.traceId, trace);
  return Array.from(byId.values()).sort((left, right) => left.decisionIndex - right.decisionIndex || left.createdAt.localeCompare(right.createdAt));
}

export function mergeMaintenanceAiTraceMatches(current: MaintenanceAiTraceMatchEntry[], incoming: MaintenanceAiTraceMatchEntry[]): MaintenanceAiTraceMatchEntry[] {
  const byId = new Map<string, MaintenanceAiTraceMatchEntry>();
  for (const match of current) byId.set(match.matchId, match);
  for (const match of incoming) byId.set(match.matchId, match);
  return Array.from(byId.values()).sort((left, right) => {
    const leftDate = Date.parse(left.lastTraceAt ?? left.updatedAt ?? left.createdAt);
    const rightDate = Date.parse(right.lastTraceAt ?? right.updatedAt ?? right.createdAt);
    return rightDate - leftDate || left.matchId.localeCompare(right.matchId);
  });
}

export function latestMaintenanceAiTraceId(traces: MaintenanceAiTraceIndexEntry[]): string {
  return traces.at(-1)?.traceId ?? "";
}

export function buildMaintenanceAiTraceNdjsonExport(input: { matchId: string; generatedAt: string; traces: MaintenanceAiTraceIndexEntry[] }): string {
  const payload = {
    exportKind: "netgrid-ai-decision-trace-index-export-v1",
    redaction: "maintenance-redacted-index-projection",
    matchId: input.matchId,
    generatedAt: input.generatedAt,
    traceCount: input.traces.length
  };
  const lines = [payload, ...input.traces].map((entry) => JSON.stringify(entry));
  const output = `${lines.join("\n")}\n`;
  const markers = findForbiddenMaintenanceMarkers(output);
  if (markers.length > 0) throw new Error("ai_trace_export_redaction_failed");
  return output;
}

export function aiTraceTitle(trace: Pick<MaintenanceAiTraceIndexEntry, "decisionIndex" | "side" | "planKind" | "selectedActionType">): string {
  const side = trace.side === "runner" ? "Runner" : "Korp";
  const action = trace.selectedActionType ?? "KI-Entscheidung";
  const plan = trace.planKind && trace.planKind !== action ? ` · ${aiTracePlanLabel(trace.planKind)}` : "";
  return `#${trace.decisionIndex} ${side} · ${action}${plan}`;
}

export function aiTracePlanLabel(value: string): string {
  const labels: Record<string, string> = {
    access_trash_steal: "Zugriff / Trash / Steal",
    basic_economy_draw: "Credits / Karten ziehen",
    basic_install: "Installieren / Aufbau",
    board_safety: "Board-Sicherheit",
    choice_resolution: "Auswahl auflösen",
    encounter_survival: "ICE-Begegnung überstehen",
    end_turn: "Zug beenden",
    mandatory_draw: "Pflichtkarte ziehen",
    remote_contest: "Remote angreifen",
    "runner.obtain_breaker_coverage": "Runner: Breaker-Abdeckung",
    "runner.contest_remote": "Runner: Remote contesten",
    "runner.opportunistic_central_run": "Runner: Zentralserver prüfen",
    "runner.build_credit_bank": "Runner: Credit-Bank aufbauen",
    "runner.cash_out_credit_bank": "Runner: Credit-Bank auszahlen",
    "corp.create_score_window": "Korp: Score-Fenster schaffen",
    "corp.build_credit_bank": "Korp: Credit-Bank aufbauen",
    "corp.rez_defense": "Korp: Verteidigung rezzen",
    simple_hq_or_rnd_pressure: "HQ/R&D-Druck",
    simple_rez: "ICE rezzen",
    simple_run_choice: "Run fortsetzen",
    simple_score_advance: "Agenda punkten/advancen",
    tag_removal: "Tags entfernen"
  };
  return labels[value] ?? value;
}

export function aiTraceMetaRows(trace: MaintenanceAiTraceDetail | MaintenanceAiTraceIndexEntry): Array<[string, string]> {
  const detail = "detail" in trace ? trace.detail : trace.meta;
  const debugSelectedActionType = typeof detail.debugSelectedActionType === "string" ? detail.debugSelectedActionType : undefined;
  const debugSelectionMatchesApplied = typeof detail.debugSelectionMatchesApplied === "boolean" ? detail.debugSelectionMatchesApplied : undefined;
  return [
    ["Entscheidung", String(trace.decisionIndex)],
    ["Seite", trace.side === "runner" ? "Runner" : "Korp"],
    ["State", String(trace.stateVersion)],
    ["Match-Version", String(trace.matchVersion)],
    ["Ausgeführt", trace.selectedActionType ?? "-"],
    ...(debugSelectedActionType ? [["Debug-Auswahl", debugSelectedActionType] as [string, string]] : []),
    ...(debugSelectionMatchesApplied === false ? [["Debug-Kopplung", "abweichend"] as [string, string]] : []),
    ["Plan", trace.planKind ? aiTracePlanLabel(trace.planKind) : "-"],
    ["Score", typeof trace.score === "number" ? trace.score.toFixed(2) : "-"],
    ["Vertrauen", typeof trace.confidence === "number" ? `${Math.round(trace.confidence * 100)}%` : "-"]
  ];
}

export function aiTraceActionRows(detail: Record<string, unknown>, limit = 8): MaintenanceAiTraceActionRow[] {
  const alternatives = Array.isArray(detail.actionAlternatives) ? detail.actionAlternatives : [];
  const appliedActionId = typeof detail.selectedActionId === "string" ? detail.selectedActionId : "";
  const trustDebugSelected = appliedActionId.length === 0 && detail.debugSelectionMatchesApplied !== false;
  return alternatives
    .slice(0, Math.max(0, limit))
    .map((entry, index): MaintenanceAiTraceActionRow | undefined => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
      const action = entry as Record<string, unknown>;
      const rank = typeof action.rank === "number" && Number.isFinite(action.rank) ? Math.max(1, Math.round(action.rank)) : index + 1;
      const actionId = typeof action.actionId === "string" ? action.actionId : `action-${rank}`;
      const actionType = typeof action.actionType === "string" ? action.actionType : "Aktion";
      const economy = action.economy && typeof action.economy === "object" && !Array.isArray(action.economy) ? action.economy as Record<string, unknown> : undefined;
      const sourceTitle = typeof action.sourceTitle === "string" ? action.sourceTitle : "";
      const rawLabel = typeof action.label === "string" ? action.label : actionType;
      const debugSelected = action.selected === true;
      const excluded = action.excluded === true;
      const selected = appliedActionId.length > 0 ? actionId === appliedActionId : trustDebugSelected && debugSelected;
      const debugOnlySelection = debugSelected && !selected;
      return {
        key: `${rank}:${actionId}`,
        rank,
        label: aiTraceActionLabel(rawLabel, actionType, sourceTitle, economy),
        selected,
        debugSelected,
        excluded,
        source: sourceTitle || (typeof action.source === "string" ? action.source : "-"),
        priority: excluded ? "-" : typeof action.priority === "number" && Number.isFinite(action.priority) ? action.priority.toFixed(0) : "-",
        metrics: aiTraceActionMetrics(economy),
        scoreRows: aiTraceScoreRows(action, 12),
        reason: excluded
          ? aiTraceExcludedActionReason(action.whyNot)
          : debugOnlySelection
            ? "Debug-Auswahl, nicht ausgeführt"
            : aiTraceActionReason(selected ? action.whyChosen : action.whyNot)
      };
    })
    .filter((entry): entry is MaintenanceAiTraceActionRow => Boolean(entry));
}

export function aiTraceScoreRows(detail: Record<string, unknown>, limit = 8): Array<[string, string]> {
  return recordList(detail.scoreBreakdown)
    .slice(0, Math.max(0, limit))
    .map((component): [string, string] => {
      const label = String(component.label ?? component.key ?? "Komponente");
      const value = typeof component.value === "number" && Number.isFinite(component.value) ? component.value.toFixed(2) : "-";
      return [label, value];
    });
}

export function aiTraceDoctrineRows(detail: Record<string, unknown>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  if (typeof detail.doctrinePlanWeight === "number" && Number.isFinite(detail.doctrinePlanWeight)) {
    rows.push(["Doctrine-Gewicht", detail.doctrinePlanWeight.toFixed(2)]);
  }
  const doctrine = detail.ownDeckDoctrine && typeof detail.ownDeckDoctrine === "object" && !Array.isArray(detail.ownDeckDoctrine)
    ? detail.ownDeckDoctrine as Record<string, unknown>
    : undefined;
  if (!doctrine) return rows;
  if (doctrine.side === "runner" || doctrine.side === "corp") rows.push(["Doctrine-Seite", doctrine.side === "runner" ? "Runner" : "Korp"]);
  if (typeof doctrine.confidence === "number" && Number.isFinite(doctrine.confidence)) rows.push(["Doctrine-Vertrauen", `${Math.round(doctrine.confidence * 100)}%`]);
  const archetypeTags = safeStringList(doctrine.archetypeTags, 4);
  if (archetypeTags.length > 0) rows.push(["Archetypen", archetypeTags.join(", ")]);
  const riskFlags = safeStringList(doctrine.riskFlags, 4);
  if (riskFlags.length > 0) rows.push(["Risiken", riskFlags.join(", ")]);
  return rows;
}

export function aiTraceDebugGapNotes(detail: Record<string, unknown>): string[] {
  const notes: string[] = [];
  const actionRows = aiTraceActionRows(detail);
  if (detail.debugSelectionMatchesApplied === false) {
    notes.push("Debug-Auswahl weicht von der ausgeführten Action ab; Semantic- und Legacy-/Plan-Diagnose getrennt prüfen.");
  }
  if (typeof detail.selectedActionId === "string" && actionRows.length > 0 && !actionRows.some((row) => row.selected)) {
    notes.push("Ausgeführte Action ist nicht im Action-Level-Ranking des Trace enthalten.");
  }
  if (actionRows.length === 0 && recordList(detail.rankedAlternatives).length === 0) {
    notes.push("Keine Top-Alternativen im aktuellen Trace.");
  }
  if (aiTraceScoreRows(detail).length === 0) {
    notes.push("Keine Score-Komponenten im aktuellen Trace.");
  }
  if (safeStringList(detail.longTermPlan, 1).length === 0 && aiTraceDoctrineRows(detail).length === 0 && typeof detail.planKind !== "string") {
    notes.push("Keine Plan-/Doctrine-Beiträge im aktuellen Trace.");
  }
  return notes;
}

function aiTraceActionLabel(rawLabel: string, actionType: string, sourceTitle: string, economy: Record<string, unknown> | undefined): string {
  const economyKind = typeof economy?.economyKind === "string" ? economy.economyKind : "";
  if (economyKind === "basic_credit") return "Credit nehmen";
  if (sourceTitle && economyKind === "pool_build") return `${sourceTitle} laden`;
  if (sourceTitle && economyKind === "pool_payout") return `${sourceTitle} auszahlen`;
  return rawLabel || actionType;
}

function aiTraceActionMetrics(economy: Record<string, unknown> | undefined): string[] {
  if (!economy) return [];
  const metrics: string[] = [];
  const immediateGain = numberField(economy, "immediateGain");
  const netCredits = numberField(economy, "netCredits");
  const storedCredits = numberField(economy, "storedCredits");
  const futurePoolAfter = numberField(economy, "futurePoolAfter");
  if (immediateGain !== undefined) metrics.push(`jetzt ${formatSignedCredits(immediateGain)}`);
  if (netCredits !== undefined && netCredits !== immediateGain) metrics.push(`netto ${formatSignedCredits(netCredits)}`);
  if (storedCredits !== undefined && storedCredits > 0) metrics.push(`gespeichert ${storedCredits}`);
  if (futurePoolAfter !== undefined) metrics.push(`Pool nachher ${futurePoolAfter}`);
  if (typeof economy.economyNeed === "string") metrics.push(`Bedarf ${economy.economyNeed}`);
  return metrics;
}

function aiTraceActionReason(value: unknown): string {
  if (!Array.isArray(value)) return "-";
  return value.find((entry): entry is string => typeof entry === "string") ?? "-";
}

function aiTraceExcludedActionReason(value: unknown): string {
  if (!Array.isArray(value)) return "Ausgeschlossen";
  const readable = value.find((entry): entry is string => typeof entry === "string" && !entry.startsWith("semantic_excluded:"));
  const marker = value.find((entry): entry is string => typeof entry === "string" && entry.startsWith("semantic_excluded:"));
  if (readable) return `Ausgeschlossen · ${readable}`;
  if (marker) return `Ausgeschlossen · ${marker.slice("semantic_excluded:".length)}`;
  return "Ausgeschlossen";
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function recordList(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function formatSignedCredits(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function safeStringList(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string").slice(0, limit);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatAge(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 60) return "gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export function modeLabel(mode: string): string {
  if (mode === "human_vs_human") return "Mensch gegen Mensch";
  if (mode === "human_runner_vs_corp_ai") return "Runner gegen Korp-KI";
  if (mode === "human_corp_vs_runner_ai") return "Korp gegen Runner-KI";
  return mode || "-";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Lobby offen",
    waiting_for_runner: "Wartet auf Runner",
    waiting_for_corp: "Wartet auf Korp",
    waiting_for_joiner_decks: "Wartet auf Deckwahl",
    ready_check: "Bereitschaft",
    countdown: "Countdown",
    active: "Aktiv",
    cancelled: "Abgebrochen",
    abandoned: "Verlassen",
    forfeited: "Aufgegeben",
    finished: "Beendet"
  };
  return labels[status] ?? status;
}

export function participantsLabel(participants: MaintenanceParticipant[]): string {
  if (participants.length === 0) return "-";
  return participants.map((participant) => `${participant.side === "runner" ? "Runner" : "Korp"}: ${participant.displayName}`).join(" · ");
}

export function findForbiddenMaintenanceMarkers(value: unknown): string[] {
  const text = JSON.stringify(value);
  return SENSITIVE_MARKERS.filter((marker) => marker.test(text)).map((marker) => marker.source);
}
