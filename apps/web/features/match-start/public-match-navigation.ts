import type { PublicMatchEntry } from "../../lib/client-api";

const SERVER_HTTP =
  process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

export function publicMatchActionLabel(
  status: PublicMatchEntry["status"],
): string {
  if (status === "open") return "Beitreten";
  if (status === "active") return "Zuschauen";
  return "Replay ansehen";
}

export function publicMatchParticipantLabel(entry: PublicMatchEntry): string {
  return (
    [entry.participantNames.runner, entry.participantNames.corp]
      .filter(Boolean)
      .join(" vs ") || "Teilnehmer werden vorbereitet"
  );
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

export function publicGamebookTarget(
  entry: PublicMatchEntry,
): string | undefined {
  if (entry.status !== "finished") return undefined;
  return `${SERVER_HTTP}/api/replays/${encodeURIComponent(entry.matchId)}/gamebook`;
}
