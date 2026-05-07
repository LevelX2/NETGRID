import { describe, expect, it } from "vitest";
import { parseRecoverableSessionFromStorage, serializeRecoverableSessionForStorage, type SessionInfo } from "./session-recovery";

const session: SessionInfo = {
  matchId: "match_pc_restart",
  side: "runner",
  sessionToken: "session_secret_for_restart",
  reconnectToken: "reconnect_secret_for_restart",
  webSocketUrl: "ws://127.0.0.1:8787/ws",
  displayName: "Meister"
};

describe("session recovery storage", () => {
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
});
