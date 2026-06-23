import type { SessionInfo } from "../app/session-recovery";

export function reconnectUrlForSession(session: SessionInfo): string {
  const url = new URL(window.location.pathname || "/", window.location.origin);
  url.searchParams.set("matchId", session.matchId);
  url.searchParams.set("side", session.side);
  url.searchParams.set("reconnectToken", session.reconnectToken);
  return url.toString();
}
