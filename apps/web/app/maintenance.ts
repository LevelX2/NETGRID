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
  };
  cleanupAssessment: {
    eligibleInReadOnlySlice: false;
    recommendation: "not_active";
    reason: string;
  };
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
  /game_state_json/i
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
