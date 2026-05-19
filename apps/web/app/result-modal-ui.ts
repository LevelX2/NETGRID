import type { Side, Winner } from "@netgrid/shared";

export type ResultWinnerMotifKind = Side | "draw";
export type ResultWinnerMotifUi = {
  ariaLabel: string;
  caption: string;
  imageSrc?: string;
};

export function resultWinnerMotifFor(winner: Winner): ResultWinnerMotifKind {
  return winner === "runner" || winner === "corp" ? winner : "draw";
}

export function resultWinnerMotifUi(motif: ResultWinnerMotifKind): ResultWinnerMotifUi {
  if (motif === "runner") {
    return {
      ariaLabel: "Runner-Sieg",
      caption: "Runner",
      imageSrc: "/result-motifs/result-runner-victory.png"
    };
  }
  if (motif === "corp") {
    return {
      ariaLabel: "Korp-Sieg",
      caption: "Korp",
      imageSrc: "/result-motifs/result-corp-victory.png"
    };
  }
  return {
    ariaLabel: "Unentschieden",
    caption: "Draw"
  };
}

export function resultFooterOutcomeLabel(winner: Winner, viewerSide: Side, opponentName?: string): string {
  if (winner === "draw") return "Draw";
  return winner === viewerSide ? "Deine Seite" : opponentName ?? "Gegenseite";
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
