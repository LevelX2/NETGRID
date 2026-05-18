import type { Side, Winner } from "@netgrid/shared";

export type ResultWinnerMotifKind = Side | "draw";

export function resultWinnerMotifFor(winner: Winner): ResultWinnerMotifKind {
  return winner === "runner" || winner === "corp" ? winner : "draw";
}

export function retentionProtectionUi(retentionProtected: boolean): { label: string; title: string } {
  return retentionProtected
    ? {
        label: "Replay-Sicherung entfernen",
        title: "Entfernt den Schutz vor History- und Cleanup-Löschung. Das Spielergebnis bleibt unverändert."
      }
    : {
        label: "Spiel für Replay sichern",
        title: "Schützt dieses Spiel vor History- und Cleanup-Löschung, damit das Replay später verfügbar bleibt. Das Spielergebnis bleibt unverändert."
      };
}

export function resultExitButtonUi(hasNextSeriesGame: boolean): { label: string; title: string; needsConfirmation: boolean } {
  return hasNextSeriesGame
    ? {
        label: "Serie verlassen",
        title: "Verlässt die lokale Serie-Sitzung, ohne das nächste Serienspiel zu starten.",
        needsConfirmation: true
      }
    : {
        label: "Zurück zum Startbildschirm",
        title: "Zurück zum Startbildschirm",
        needsConfirmation: false
      };
}
