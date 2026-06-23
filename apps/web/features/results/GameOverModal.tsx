import { Award, Save } from "lucide-react";
import type { ApiGameResultSummary, Side } from "@netgrid/shared";

import { Stat } from "../game-board/ResourceStrip";
import { shortDiagnosticsHash } from "../debug/DiagnosticsDrawer";
import { matchFormatLabel, resultReasonLabel, seriesStatusText } from "../match-start/lobby-format";
import {
  gameStandingForResult,
  resultExitButtonUi,
  resultFooterOutcomeLabel,
  resultOutcomeHeadline,
  resultOutcomeText,
  resultPlayerLabel,
  resultPlayerRoleLabel,
  resultWinnerMotifFor,
  resultWinnerMotifUi,
  retentionProtectionUi,
  seriesResultHeadline,
  type ResultWinnerMotifKind
} from "../../app/result-modal-ui";

type GameResultSummary = ApiGameResultSummary;
const AgendaIcon = Award;

function opponentSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

export function GameOverModal({
  result,
  side,
  onDismiss,
  onNewMatch,
  onNextSeriesGame,
  opponentName,
  playerName,
  retentionProtected,
  onRetentionProtection,
  nextSeriesPending = false
}: {
  result: GameResultSummary;
  side: Side;
  onDismiss(): void;
  onNewMatch(): void;
  onNextSeriesGame?: () => void;
  opponentName?: string;
  playerName?: string;
  retentionProtected: boolean;
  onRetentionProtection(protectedValue: boolean): void;
  nextSeriesPending?: boolean;
}) {
  const outcomeText = resultOutcomeHeadline(result.winner, side, playerName, opponentName);
  const seriesHeadline = result.series ? seriesResultHeadline(result.series, opponentName, playerName) : null;
  const headlineText = seriesHeadline ?? outcomeText;
  const lastGameOutcomeText = resultOutcomeText(result.winner);
  const reasonText = seriesHeadline
    ? `Letztes Spiel: ${lastGameOutcomeText} ${resultReasonLabel(result.reason, result.winner)}`
    : resultReasonLabel(result.reason, result.winner);
  const gameStanding = gameStandingForResult(result, side, playerName, opponentName);
  const winnerMotif = resultWinnerMotifFor(result.winner);
  const winnerMotifUi = resultWinnerMotifUi(winnerMotif);
  const opponentSideLabel = opponentSide(side);
  const playerSeriesLabel = resultPlayerLabel(side, side, playerName, opponentName);
  const opponentSeriesLabel = resultPlayerLabel(opponentSideLabel, side, playerName, opponentName);
  const playerStandingLabel = resultPlayerRoleLabel(side, side, playerName, opponentName);
  const opponentStandingLabel = resultPlayerRoleLabel(opponentSideLabel, side, playerName, opponentName);
  const seriesText = result.series ? seriesStatusText(result.series, playerSeriesLabel, opponentSeriesLabel) : null;
  const retentionUi = retentionProtectionUi(retentionProtected);
  const exitUi = resultExitButtonUi(Boolean(onNextSeriesGame));
  const handleNewMatch = () => {
    if (
      exitUi.needsConfirmation &&
      !window.confirm("Matchserie verlassen? Das nächste Serienspiel wird nicht gestartet und diese lokale Sitzung wird entfernt.")
    ) {
      return;
    }
    onNewMatch();
  };
  return (
    <div className={`gameOverOverlay ${result.viewerOutcome}`} role="dialog" aria-modal="true" aria-labelledby="game-over-title">
      <div className="gameOverBackdrop" aria-hidden="true" />
      <section className={`gameOverPanel ${winnerMotifUi.imageSrc ? "withMotifHero" : ""}`}>
        <div className={`gameOverHero ${winnerMotifUi.imageSrc ? "withVisualMotif" : ""}`}>
          <div className="gameOverHeroCopy">
            <p className="eyebrow">{matchFormatLabel(result.matchFormat)}</p>
            <h2 id="game-over-title">{headlineText}</h2>
            <p>{reasonText}</p>
          </div>
          <ResultWinnerMotif motif={winnerMotif} />
        </div>
        {gameStanding ? (
          <div className="gameStandingStrip" aria-label="Spielwertung">
            <div>
              <span>Spielwertung</span>
              <small>{gameStanding.summary}</small>
            </div>
            <div className="gameStandingScore">
              <span>{playerStandingLabel} {gameStanding.viewerMatchPoints} MP · {gameStanding.viewerAgendaPoints} Agenda</span>
              <span>{opponentStandingLabel} {gameStanding.opponentMatchPoints} MP · {gameStanding.opponentAgendaPoints} Agenda</span>
            </div>
          </div>
        ) : null}
        <div className="gameOverStats">
          <Stat label="Agenda" value={`${result.runnerAgendaPoints} / ${result.agendaPointsToWin}`} unit="Runner" icon={<AgendaIcon size={14} />} />
          <Stat label="Agenda" value={`${result.corpAgendaPoints} / ${result.agendaPointsToWin}`} unit="Korp" icon={<AgendaIcon size={14} />} />
          <Stat value={result.agendaPointsToWin} unit="Zielwert" />
          <Stat value={result.actionCount} unit="Aktionen" />
          <Stat value={result.runCount} unit="Runs" />
          <Stat value={result.successfulRunCount} unit="Zugriffe" />
          <Stat value={result.stolenAgendaCount} unit="Gestohlen" />
          <Stat value={result.scoredAgendaCount} unit="Gescored" />
        </div>
        {result.series ? (
          <div className="seriesStrip">
            <div>
              <span>Serienspiel {result.series.gameNumber}/{result.series.gamesPlanned}</span>
              <small>{seriesText}</small>
            </div>
            <div className="seriesScore">
              <span>Matchpunkte {playerStandingLabel} {result.series.viewerMatchPoints}</span>
              <span>Matchpunkte {opponentStandingLabel} {result.series.opponentMatchPoints}</span>
              <span>Siege {playerStandingLabel} {result.series.viewerWins}</span>
              <span>Siege {opponentStandingLabel} {result.series.opponentWins}</span>
              <span>Draws {result.series.draws}</span>
              <span>Agenda {playerStandingLabel} {result.series.viewerAgendaPoints}</span>
              <span>Agenda {opponentStandingLabel} {result.series.opponentAgendaPoints}</span>
            </div>
          </div>
        ) : null}
        <div className="gameOverFooter">
          <div>
            <span>{resultFooterOutcomeLabel(result.winner, side, opponentName)}</span>
            <small>{shortDiagnosticsHash(result.finalStateHash)}</small>
          </div>
          <div className="gameOverActions">
            <button className="button" onClick={() => onRetentionProtection(!retentionProtected)} title={retentionUi.title} aria-label={retentionUi.title}>
              <Save size={15} />
              {retentionUi.label}
            </button>
            <button className="button" onClick={onDismiss}>
              Board ansehen
            </button>
            {onNextSeriesGame ? (
              <button className="button primary" onClick={onNextSeriesGame} disabled={nextSeriesPending}>
                {nextSeriesPending ? "Erstelle..." : "Nächstes Serienspiel"}
              </button>
            ) : null}
            <button className={`button ${onNextSeriesGame ? "seriesExitButton" : "primary"}`} onClick={handleNewMatch} title={exitUi.title}>
              {exitUi.label}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultWinnerMotif({ motif }: { motif: ResultWinnerMotifKind }) {
  const motifUi = resultWinnerMotifUi(motif);
  return (
    <div className={`resultWinnerMotif ${motif} ${motifUi.imageSrc ? "bitmap" : "neutral"}`} aria-label={motifUi.ariaLabel} role="img">
      <div className="resultMotifFrame">
        {motifUi.imageSrc ? (
          <img src={motifUi.imageSrc} alt="" aria-hidden="true" />
        ) : (
          <>
            <span className="resultMotifCore" />
            <span className="resultMotifTrack one" />
            <span className="resultMotifTrack two" />
            <span className="resultMotifTrack three" />
          </>
        )}
      </div>
      <span>{motifUi.caption}</span>
    </div>
  );
}
