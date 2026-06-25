import type {
  ApiCreateMatchResponse,
  ApiJoinMatchResponse,
  ApiLobbyPayload,
  ApiRecentResultEntry,
  ApiSidePayload,
  LegalAction,
  Side
} from "@netgrid/shared";

import {
  buildMaintenanceAiTraceEnablePath,
  buildMaintenanceAiTraceIndexPath,
  findForbiddenMaintenanceMarkers,
  type MaintenanceAiTraceDetail,
  type MaintenanceAiTraceIndexEntry
} from "../app/maintenance";
import type { SessionInfo } from "../app/session-recovery";

const SERVER_HTTP = process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";
const SERVER_UNREACHABLE_NOTICE = `Multiplayer-Server nicht erreichbar (${SERVER_HTTP}). Bitte starte den lokalen Multiplayer-Server und versuche es erneut.`;

type ClientPayload = ApiSidePayload;
type LobbyClientPayload = ApiLobbyPayload;
type CreateMatchResponse = ApiCreateMatchResponse;
type JoinMatchResponse = ApiJoinMatchResponse;

export type AiDecisionPreview = {
  matchId: string;
  matchVersion: number;
  stateVersion: number;
  requestedBy: Side;
  side: Side;
  generatedAt: string;
  actionId: string;
  actionType: LegalAction["type"];
  actionLabel: string;
  reasonCode: string;
  explanation: string;
  fallbackUsed: boolean;
  timeoutUsed?: boolean;
  confidence?: number;
  selectedChoices?: Record<string, unknown>;
  detail: Record<string, unknown>;
};

export type OpenMatchEntry = {
  matchId: string;
  hostDisplayName: string;
  mode: "human_vs_human";
  status: "pending";
  createdAt: string;
  ageSeconds: number;
};

export type OpenMatchesResponse = {
  matches?: OpenMatchEntry[];
  error?: { message: string };
};

export type RecentGameResultsResponse = {
  results?: ApiRecentResultEntry[];
  error?: { message: string };
};

export function fromInitialResponse(response: CreateMatchResponse, side: Side): ClientPayload {
  if (!response.playerView) throw new Error("Match ist noch nicht aktiv.");
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? (response.mode === "human_vs_human" ? "pending" : "active"),
    matchVersion: response.matchVersion,
    side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.playerView.publicEvents,
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: response.mode !== "human_vs_human" }
  };
  if (response.playerClock) payload.playerClock = response.playerClock;
  if (response.aiTurnPresentation) payload.aiTurnPresentation = response.aiTurnPresentation;
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  if (response.retentionProtected) payload.retentionProtected = response.retentionProtected;
  if (response.retentionProtectedAt) payload.retentionProtectedAt = response.retentionProtectedAt;
  return payload;
}

export function fromJoinedResponse(response: JoinMatchResponse): ClientPayload {
  if (!response.playerView) throw new Error("Match ist noch nicht aktiv.");
  const winner = response.winner ?? response.playerView.winner;
  const payload: ClientPayload = {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "active",
    matchVersion: response.matchVersion,
    side: response.side,
    playerView: response.playerView,
    legalActions: response.legalActions,
    eventTail: response.eventTail ?? response.playerView.publicEvents,
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false }
  };
  if (response.playerClock) payload.playerClock = response.playerClock;
  if (response.aiTurnPresentation) payload.aiTurnPresentation = response.aiTurnPresentation;
  if (response.pendingUndo) payload.pendingUndo = response.pendingUndo;
  if (winner) payload.winner = winner;
  if (response.finalStateHash) payload.finalStateHash = response.finalStateHash;
  if (response.resultSummary) payload.resultSummary = response.resultSummary;
  if (response.retentionProtected) payload.retentionProtected = response.retentionProtected;
  if (response.retentionProtectedAt) payload.retentionProtectedAt = response.retentionProtectedAt;
  return payload;
}

export function lobbyFromInitialResponse(response: CreateMatchResponse, side: Side): LobbyClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "pending",
    matchVersion: response.matchVersion,
    side,
    eventTail: [],
    opponentStatus: { side: side === "runner" ? "corp" : "runner", connected: false },
    ...(response.playerClock ? { playerClock: response.playerClock } : {}),
    ...(response.pendingDeckHandshake ? { pendingDeckHandshake: { required: true, message: "Die Lobby wartet auf die Deckauswahl von Teilnehmer B." } } : {}),
    ...(response.lobby ? { startLobby: response.lobby } : {})
  };
}

export function lobbyFromJoinedResponse(response: JoinMatchResponse): LobbyClientPayload {
  return {
    matchId: response.matchId,
    matchStatus: response.matchStatus ?? "ready_check",
    matchVersion: response.matchVersion,
    side: response.side,
    eventTail: response.eventTail ?? [],
    opponentStatus: { side: response.side === "runner" ? "corp" : "runner", connected: false },
    ...(response.playerClock ? { playerClock: response.playerClock } : {}),
    ...(response.lobby ? { startLobby: response.lobby } : {})
  };
}

export function normalizeWebSocketUrl(value: string): string {
  return value
    .trim()
    .replace(/\s+(:\d+(?:\/|$|[?#]))/g, "$1")
    .replace(/\s+(?=\/ws(?:$|[?#]))/, "");
}

export async function bootstrap(session: SessionInfo): Promise<ClientPayload | LobbyClientPayload | null> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/bootstrap?side=${session.side}`, {
      headers: { authorization: `Bearer ${session.sessionToken}` },
      cache: "no-store"
    });
  } catch {
    throw new ServerConnectionError();
  }
  if (!response.ok) return null;
  return (await response.json()) as ClientPayload | LobbyClientPayload;
}

export async function fetchOpenLanMatches(): Promise<OpenMatchesResponse> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/open`, { cache: "no-store" });
  } catch {
    throw new ServerConnectionError();
  }
  if (!response.ok) {
    let payload: OpenMatchesResponse | undefined;
    try {
      payload = (await response.json()) as OpenMatchesResponse;
    } catch {
      payload = undefined;
    }
    if (payload?.error?.message) return { error: { message: payload.error.message } };
    if (response.status === 404) {
      return { error: { message: "Dein Multiplayer-Server unterstützt die LAN-Liste noch nicht. Bitte den Server neu starten oder auf den aktuellen Stand bringen." } };
    }
    return { error: { message: "Offene Spiele konnten nicht geladen werden." } };
  }
  return (await response.json()) as OpenMatchesResponse;
}

export async function fetchRecentGameResults(): Promise<RecentGameResultsResponse> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/recent-results?limit=20`, { cache: "no-store" });
  } catch {
    throw new ServerConnectionError();
  }
  if (!response.ok) {
    let payload: RecentGameResultsResponse | undefined;
    try {
      payload = (await response.json()) as RecentGameResultsResponse;
    } catch {
      payload = undefined;
    }
    if (payload?.error?.message) return { error: { message: payload.error.message } };
    if (response.status === 404) {
      return { error: { message: "Dein Multiplayer-Server unterstützt letzte Spiele noch nicht. Bitte den Server neu starten oder auf den aktuellen Stand bringen." } };
    }
    return { error: { message: "Letzte Spiele konnten nicht geladen werden." } };
  }
  return (await response.json()) as RecentGameResultsResponse;
}

export async function enableAiDecisionDebugTracing(matchId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}${buildMaintenanceAiTraceEnablePath(matchId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "detailed" })
    });
  } catch {
    throw new ServerConnectionError();
  }
  const payload = (await response.json()) as { match?: unknown; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace konnte nicht aktiviert werden.");
  const markers = findForbiddenMaintenanceMarkers(payload);
  if (markers.length > 0) throw new Error("KI-Trace-Aktivierung wurde wegen Redaktionsprüfung blockiert.");
}

export async function fetchAiDecisionDebugTraceIndex(matchId: string): Promise<MaintenanceAiTraceIndexEntry[]> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}${buildMaintenanceAiTraceIndexPath(matchId)}`, { cache: "no-store" });
  } catch {
    throw new ServerConnectionError();
  }
  const payload = (await response.json()) as { traces?: MaintenanceAiTraceIndexEntry[]; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "KI-Trace-Timeline konnte nicht geladen werden.");
  const markers = findForbiddenMaintenanceMarkers(payload);
  if (markers.length > 0) throw new Error("KI-Trace-Timeline wurde wegen Redaktionsprüfung blockiert.");
  return payload.traces ?? [];
}

export async function fetchAiDecisionDebugTraceDetail(traceId: string): Promise<MaintenanceAiTraceDetail> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/storage/maintenance/ai-decision-traces/${encodeURIComponent(traceId)}`, { cache: "no-store" });
  } catch {
    throw new ServerConnectionError();
  }
  const payload = (await response.json()) as MaintenanceAiTraceDetail | { error?: { message?: string } };
  if (!response.ok) throw new Error("error" in payload ? payload.error?.message ?? "KI-Trace-Detail konnte nicht geladen werden." : "KI-Trace-Detail konnte nicht geladen werden.");
  const markers = findForbiddenMaintenanceMarkers(payload);
  if (markers.length > 0) throw new Error("KI-Trace-Detail wurde wegen Redaktionsprüfung blockiert.");
  return payload as MaintenanceAiTraceDetail;
}

export async function fetchAiDecisionPreview(session: SessionInfo, payload: ClientPayload): Promise<AiDecisionPreview> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}/api/matches/${encodeURIComponent(session.matchId)}/ai-preview`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.sessionToken}`
      },
      body: JSON.stringify({
        side: session.side,
        knownStateVersion: payload.playerView.stateVersion,
        knownMatchVersion: payload.matchVersion
      })
    });
  } catch {
    throw new ServerConnectionError();
  }
  const previewPayload = (await response.json()) as { ok?: boolean; preview?: AiDecisionPreview; error?: { message?: string } };
  const markers = findForbiddenMaintenanceMarkers(previewPayload.preview ?? previewPayload.error ?? {});
  if (markers.length > 0) throw new Error("KI-Preview wurde wegen Redaktionsprüfung blockiert.");
  if (!response.ok || !previewPayload.preview) throw new Error(previewPayload.error?.message ?? "KI-Preview konnte nicht geladen werden.");
  return previewPayload.preview;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SERVER_HTTP}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ServerConnectionError();
  }
  return (await response.json()) as T;
}

class ServerConnectionError extends Error {
  constructor() {
    super(SERVER_UNREACHABLE_NOTICE);
    this.name = "ServerConnectionError";
  }
}

export function serverErrorNotice(error: unknown, fallback: string): string {
  if (error instanceof ServerConnectionError) return error.message;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) return SERVER_UNREACHABLE_NOTICE;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
