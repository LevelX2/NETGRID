import type { PublicMatchEntry } from "../../lib/client-api";

export function publicMatchActionLabel(status: PublicMatchEntry["status"]): string {
  if (status === "open") return "Beitreten";
  if (status === "active") return "Zuschauen";
  return "Replay ansehen";
}

export function publicMatchParticipantLabel(entry: PublicMatchEntry): string {
  return [entry.participantNames.runner, entry.participantNames.corp]
    .filter(Boolean)
    .join(" vs ") || "Teilnehmer werden vorbereitet";
}

export function publicMatchTarget(entry: PublicMatchEntry): string | undefined {
  if (entry.status === "active") {
    return `/spectate?matchId=${encodeURIComponent(entry.matchId)}`;
  }
  if (entry.status === "finished") {
    return `/replays?matchId=${encodeURIComponent(entry.matchId)}`;
  }
  return undefined;
}
