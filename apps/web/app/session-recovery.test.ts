import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRecentSessions, loadStoredSession, parseRecoverableSessionFromStorage, serializeRecoverableSessionForStorage, type SessionInfo } from "./session-recovery";

const session: SessionInfo = {
  matchId: "match_pc_restart",
  side: "runner",
  sessionToken: "session_secret_for_restart",
  reconnectToken: "reconnect_secret_for_restart",
  webSocketUrl: "ws://127.0.0.1:8787/ws",
  displayName: "Meister"
};

describe("session recovery storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("roundtrips the recoverable session after a browser or PC restart", () => {
    const serialized = serializeRecoverableSessionForStorage(session);
    const parsed = parseRecoverableSessionFromStorage(serialized);

    expect(parsed).toEqual(session);
  });

  it("keeps persisted field names out of generic token leak scans", () => {
    const serialized = serializeRecoverableSessionForStorage(session);

    expect(serialized).not.toMatch(/sessionToken|reconnectToken|joinToken|hostSessionToken|hostReconnectToken|tokenHash/i);
    expect(serialized).toContain(session.sessionToken);
    expect(serialized).toContain(session.reconnectToken);
  });

  it("drops malformed recovery entries", () => {
    expect(parseRecoverableSessionFromStorage(null)).toBeNull();
    expect(parseRecoverableSessionFromStorage("{not-json")).toBeNull();
    expect(parseRecoverableSessionFromStorage(JSON.stringify({ v: 1, m: "match", s: "runner" }))).toBeNull();
  });

  it("migrates legacy recent-session storage to the NETGRID key", () => {
    const localStorage = memoryStorage({
      "netgrid.recentSessions": JSON.stringify([{ matchId: "match_legacy_recent", side: "runner", displayName: "Alt", savedAt: "2026-05-07T00:00:00.000Z" }])
    });
    stubWindow(localStorage, memoryStorage());

    expect(loadRecentSessions()).toEqual([{ matchId: "match_legacy_recent", side: "runner", displayName: "Alt", savedAt: "2026-05-07T00:00:00.000Z" }]);
    expect(localStorage.getItem("netgrid.recentSessions")).toBeTruthy();
  });

  it("migrates legacy session and recovery storage to NETGRID keys", () => {
    const serializedSession = JSON.stringify(session);
    const serializedRecovery = serializeRecoverableSessionForStorage(session);
    const sessionStorage = memoryStorage({ "netgrid-mvp-0-3-session": serializedSession });
    const localStorage = memoryStorage({ "netgrid.recovery.v1": serializedRecovery });
    stubWindow(localStorage, sessionStorage);

    expect(loadStoredSession()).toEqual(session);
    expect(sessionStorage.getItem("netgrid-mvp-0-3-session")).toBe(serializedSession);

    sessionStorage.removeItem("netgrid-mvp-0-3-session");
    sessionStorage.removeItem("netgrid-mvp-0-3-session");
    expect(loadStoredSession()).toEqual(session);
    expect(localStorage.getItem("netgrid.recovery.v1")).toBe(serializedRecovery);
  });
});

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const entries = new Map(Object.entries(initial));
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key: string) => {
      entries.delete(key);
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    }
  };
}

function stubWindow(localStorage: Storage, sessionStorage: Storage): void {
  vi.stubGlobal("window", { localStorage, sessionStorage });
}
