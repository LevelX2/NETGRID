import type { ApiMatchMode, Side } from "@netgrid/shared";

export type MatchStatus =
  | "pending"
  | "waiting_for_runner"
  | "waiting_for_corp"
  | "waiting_for_joiner_decks"
  | "ready_check"
  | "countdown"
  | "active"
  | "finished"
  | "cancelled"
  | "abandoned"
  | "forfeited";

export type SessionInfo = {
  matchId: string;
  side: Side;
  sessionToken: string;
  reconnectToken: string;
  webSocketUrl: string;
  joinUrl?: string;
  displayName: string;
  mode?: ApiMatchMode;
  pendingDeckHandshake?: boolean;
};

export type RecentSessionInfo = {
  matchId: string;
  side: Side;
  displayName: string;
  opponentDisplayName?: string;
  matchStatus?: MatchStatus;
  savedAt: string;
};

type RemoteSessionSummary = {
  opponentStatus?: {
    displayName?: string;
  };
  matchStatus?: MatchStatus;
};

type RecoverableSessionRecord = {
  v: 1;
  m: string;
  s: Side;
  a: string;
  r: string;
  w: string;
  d: string;
  o?: ApiMatchMode;
  p?: boolean;
};

export const SESSION_STORAGE_KEY = "netgrid-mvp-0-3-session";
export const RECENT_SESSIONS_KEY = "netgrid.recentSessions";
const RECOVERY_STORAGE_KEY = "netgrid.recovery.v1";

export function persistSession(session: SessionInfo, remotePayload?: RemoteSessionSummary) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  persistRecoverableSession(session);
  rememberRecentSession(session, remotePayload);
}

export function clearStoredSession(session?: Pick<SessionInfo, "matchId" | "side">): void {
  removeStorageKey(window.sessionStorage, SESSION_STORAGE_KEY);
  const recoverable = loadRecoverableSession();
  if (!session || !recoverable || (recoverable.matchId === session.matchId && recoverable.side === session.side)) {
    removeStorageKey(window.localStorage, RECOVERY_STORAGE_KEY);
  }
}

export function rememberRecentSession(session: SessionInfo, remotePayload?: RemoteSessionSummary) {
  const recent = loadRecentSessions().filter((candidate) => !(candidate.matchId === session.matchId && candidate.side === session.side));
  const next: RecentSessionInfo[] = [safeRecentSession(session, remotePayload), ...recent].slice(0, 4);
  window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
}

export function loadRecentSession(): RecentSessionInfo | null {
  return loadRecentSessions()[0] ?? null;
}

export function loadRecentSessions(): RecentSessionInfo[] {
  try {
    const parsed = JSON.parse(readStorage(window.localStorage, RECENT_SESSIONS_KEY) ?? "[]") as unknown[];
    const sanitized = parsed
      .map(sanitizeRecentSession)
      .filter((session): session is RecentSessionInfo => Boolean(session))
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .slice(0, 4);
    if (sanitized.length > 0) window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sanitized));
    else removeStorageKey(window.localStorage, RECENT_SESSIONS_KEY);
    return sanitized;
  } catch {
    removeStorageKey(window.localStorage, RECENT_SESSIONS_KEY);
    return [];
  }
}

export function loadStoredSession(): SessionInfo | null {
  const recoverable = loadRecoverableSession();
  const sessionStored = loadCurrentTabSession();
  if (!recoverable || !sessionStored) return recoverable ?? sessionStored;
  if (
    recoverable.matchId !== sessionStored.matchId ||
    recoverable.side !== sessionStored.side
  )
    return sessionStored;
  return recoverable;
}

export function loadCurrentTabSession(): SessionInfo | null {
  return loadSessionStorageSession();
}

export function subscribeToRecoverableSessionChanges(
  onChange: (session: SessionInfo | null) => void,
): () => void {
  const onStorage = (event: StorageEvent) => {
    if (
      event.storageArea !== window.localStorage ||
      event.key !== RECOVERY_STORAGE_KEY
    )
      return;
    onChange(parseRecoverableSessionFromStorage(event.newValue));
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function storedSessionMatches(recent: RecentSessionInfo | null): boolean {
  if (!recent) return false;
  const stored = loadStoredSession();
  return Boolean(stored && stored.matchId === recent.matchId && stored.side === recent.side);
}

export function removeRecentSession(session: Pick<RecentSessionInfo | SessionInfo, "matchId" | "side">): void {
  const next = loadRecentSessions().filter((candidate) => !(candidate.matchId === session.matchId && candidate.side === session.side));
  if (next.length > 0) window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
  else removeStorageKey(window.localStorage, RECENT_SESSIONS_KEY);
}

export function serializeRecoverableSessionForStorage(session: SessionInfo): string {
  const record: RecoverableSessionRecord = {
    v: 1,
    m: session.matchId,
    s: session.side,
    a: session.sessionToken,
    r: session.reconnectToken,
    w: session.webSocketUrl,
    d: session.displayName,
    ...(session.mode ? { o: session.mode } : {}),
    ...(session.pendingDeckHandshake ? { p: true } : {})
  };
  return JSON.stringify(record);
}

export function parseRecoverableSessionFromStorage(raw: string | null): SessionInfo | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RecoverableSessionRecord>;
    if (parsed.v !== 1) return null;
    if (!parsed.m || !parsed.a || !parsed.r || !parsed.w || (parsed.s !== "runner" && parsed.s !== "corp")) return null;
    return {
      matchId: parsed.m,
      side: parsed.s,
      sessionToken: parsed.a,
      reconnectToken: parsed.r,
      webSocketUrl: parsed.w,
      displayName: parsed.d?.trim() || "Du",
      ...(isKnownMatchMode(parsed.o) ? { mode: parsed.o } : {}),
      ...(parsed.p ? { pendingDeckHandshake: true } : {})
    };
  } catch {
    return null;
  }
}

function isKnownMatchMode(mode: unknown): mode is ApiMatchMode {
  return (
    mode === "human_vs_human" ||
    mode === "human_runner_vs_corp_ai" ||
    mode === "human_corp_vs_runner_ai" ||
    mode === "ai_vs_ai"
  );
}

function persistRecoverableSession(session: SessionInfo): void {
  window.localStorage.setItem(RECOVERY_STORAGE_KEY, serializeRecoverableSessionForStorage(session));
}

function loadRecoverableSession(): SessionInfo | null {
  const parsed = parseRecoverableSessionFromStorage(readStorage(window.localStorage, RECOVERY_STORAGE_KEY));
  if (!parsed) removeStorageKey(window.localStorage, RECOVERY_STORAGE_KEY);
  return parsed;
}

function loadSessionStorageSession(): SessionInfo | null {
  try {
    const stored = readStorage(window.sessionStorage, SESSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as SessionInfo;
    if (!parsed.matchId || !parsed.sessionToken || !parsed.reconnectToken || (parsed.side !== "runner" && parsed.side !== "corp")) return null;
    return parsed;
  } catch {
    removeStorageKey(window.sessionStorage, SESSION_STORAGE_KEY);
    return null;
  }
}

function readStorage(storage: Storage, key: string): string | null {
  return storage.getItem(key);
}

function removeStorageKey(storage: Storage, key: string): void {
  storage.removeItem(key);
}

function safeRecentSession(session: SessionInfo, remotePayload?: RemoteSessionSummary): RecentSessionInfo {
  return {
    matchId: session.matchId,
    side: session.side,
    displayName: session.displayName,
    ...(remotePayload?.opponentStatus?.displayName ? { opponentDisplayName: remotePayload.opponentStatus.displayName } : {}),
    ...(remotePayload?.matchStatus ? { matchStatus: remotePayload.matchStatus } : {}),
    savedAt: new Date().toISOString()
  };
}

function sanitizeRecentSession(value: unknown): RecentSessionInfo | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.matchId !== "string") return null;
  if (candidate.side !== "runner" && candidate.side !== "corp") return null;
  const savedAt = typeof candidate.savedAt === "string" ? candidate.savedAt : new Date().toISOString();
  const displayName = typeof candidate.displayName === "string" && candidate.displayName.trim() ? candidate.displayName : "Du";
  const matchStatus = typeof candidate.matchStatus === "string" && isKnownMatchStatus(candidate.matchStatus) ? candidate.matchStatus : undefined;
  const opponentDisplayName = typeof candidate.opponentDisplayName === "string" && candidate.opponentDisplayName.trim() ? candidate.opponentDisplayName : undefined;
  return {
    matchId: candidate.matchId,
    side: candidate.side,
    displayName,
    ...(opponentDisplayName ? { opponentDisplayName } : {}),
    ...(matchStatus ? { matchStatus } : {}),
    savedAt
  };
}

function isKnownMatchStatus(status: string): status is MatchStatus {
  return (
    status === "pending" ||
    status === "waiting_for_runner" ||
    status === "waiting_for_corp" ||
    status === "waiting_for_joiner_decks" ||
    status === "ready_check" ||
    status === "countdown" ||
    status === "active" ||
    status === "finished" ||
    status === "cancelled" ||
    status === "abandoned" ||
    status === "forfeited"
  );
}
