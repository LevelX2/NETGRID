import type { RecentSessionInfo } from "../../app/session-recovery";
import { sideLabel } from "../game-board/board-view-helpers";

export function recentSessionHeadline(session: RecentSessionInfo): string {
  return session.opponentDisplayName ? `${sideLabel(session.side)} gegen ${session.opponentDisplayName}` : `${sideLabel(session.side)}-Spiel`;
}

export function recentSessionStatusLabel(status: RecentSessionInfo["matchStatus"]): string {
  switch (status) {
    case "pending":
      return "Wartet";
    case "waiting_for_runner":
    case "waiting_for_corp":
    case "waiting_for_joiner_decks":
      return "Wartet auf Beitritt";
    case "ready_check":
      return "Startbereitschaft";
    case "countdown":
      return "Countdown";
    case "active":
      return "Aktiv";
    case "finished":
      return "Beendet";
    case "cancelled":
      return "Abgebrochen";
    case "abandoned":
      return "Verlassen";
    case "forfeited":
      return "Aufgegeben";
    default:
      return "Gespeichert";
  }
}
