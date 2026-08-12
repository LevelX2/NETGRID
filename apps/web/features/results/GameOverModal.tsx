import { Award, Save } from "lucide-react";
import type { ApiGameResultSummary, Side } from "@netgrid/shared";

import { Stat } from "../game-board/ResourceStrip";
import { shortDiagnosticsHash } from "../debug/DiagnosticsDrawer";
import {
  matchFormatLabel,
  resultReasonLabel,
  seriesStatusText,
} from "../match-start/lobby-format";
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
  seriesScoreUi,
  type ResultWinnerMotifKind,
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
  onReplay,
  onNextSeriesGame,
  opponentName,
  playerName,
  retentionProtected,
  onRetentionProtection,
  observerMode = false,
  nextSeriesPending = false,
}: {
  result: GameResultSummary;
  side: Side;
  onDismiss(): void;
  onNewMatch(): void;
  onReplay?: () => void;
  onNextSeriesGame?: () => void;
  opponentName?: string;
  playerName?: string;
  retentionProtected: boolean;
  onRetentionProtection(protectedValue: boolean): void;
  observerMode?: boolean;
  nextSeriesPending?: boolean;
}) {
  const observerOutcomeText =
    result.winner === "draw"
      ? "Simulation endet unentschieden"
      : `${result.winner === "runner" ? "Runner-KI" : "Korp-KI"} gewinnt`;
  const outcomeText = observerMode
    ? observerOutcomeText
    : resultOutcomeHeadline(result.winner, side, playerName, opponentName);
  const gameStanding = gameStandingForResult(
    result,
    side,
    playerName,
    opponentName,
  );
  const winnerMotif = resultWinnerMotifFor(result.winner);
  const winnerMotifUi = resultWinnerMotifUi(winnerMotif);
  const opponentSideLabel = opponentSide(side);
  const playerSeriesLabel = observerMode
    ? "KI A"
    : resultPlayerLabel(side, side, playerName, opponentName);
  const opponentSeriesLabel = observerMode
    ? "KI B"
    : resultPlayerLabel(opponentSideLabel, side, playerName, opponentName);
  const playerStandingLabel = resultPlayerRoleLabel(
    side,
    side,
    playerName,
    opponentName,
  );
  const opponentStandingLabel = resultPlayerRoleLabel(
    opponentSideLabel,
    side,
    playerName,
    opponentName,
  );
  const seriesViewerScoreLabel = observerMode
    ? playerSeriesLabel
    : playerStandingLabel;
  const seriesOpponentScoreLabel = observerMode
    ? opponentSeriesLabel
    : opponentStandingLabel;
  const seriesHeadline = result.series
    ? seriesResultHeadline(
        result.series,
        opponentSeriesLabel,
        playerSeriesLabel,
      )
    : null;
  const headlineText = seriesHeadline ?? outcomeText;
  const lastGameOutcomeText = resultOutcomeText(result.winner);
  const reasonText = seriesHeadline
    ? `Letztes Spiel: ${lastGameOutcomeText} ${resultReasonLabel(result.reason, result.winner)}`
    : resultReasonLabel(result.reason, result.winner);
  const seriesText = result.series
    ? seriesStatusText(result.series, playerSeriesLabel, opponentSeriesLabel)
    : null;
  const seriesScore = result.series
    ? seriesScoreUi(
        result.series,
        seriesViewerScoreLabel,
        seriesOpponentScoreLabel,
      )
    : null;
  const retentionUi = retentionProtectionUi(retentionProtected);
  const exitUi = resultExitButtonUi(Boolean(onNextSeriesGame));
  const handleNewMatch = () => {
    if (
      exitUi.needsConfirmation &&
      !window.confirm(
        "Matchserie verlassen? Das nächste Serienspiel wird nicht gestartet und diese lokale Sitzung wird entfernt.",
      )
    ) {
      return;
    }
    onNewMatch();
  };
  return (
    <div
      className={`gameOverOverlay ${result.viewerOutcome}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="gameOverBackdrop" aria-hidden="true" />
      <section
        className={`gameOverPanel ${winnerMotifUi.imageSrc ? "withMotifHero" : ""}`}
      >
        <div
          className={`gameOverHero ${winnerMotifUi.imageSrc ? "withVisualMotif" : ""}`}
        >
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
              <span>
                {playerStandingLabel} {gameStanding.viewerMatchPoints} MP ·{" "}
                {gameStanding.viewerAgendaPoints} Agenda
              </span>
              <span>
                {opponentStandingLabel} {gameStanding.opponentMatchPoints} MP ·{" "}
                {gameStanding.opponentAgendaPoints} Agenda
              </span>
            </div>
          </div>
        ) : null}
        <div className="gameOverStats">
          <Stat
            label="Agenda"
            value={`${result.runnerAgendaPoints} / ${result.agendaPointsToWin}`}
            unit="Runner"
            icon={<AgendaIcon size={14} />}
          />
          <Stat
            label="Agenda"
            value={`${result.corpAgendaPoints} / ${result.agendaPointsToWin}`}
            unit="Korp"
            icon={<AgendaIcon size={14} />}
          />
          <Stat value={result.agendaPointsToWin} unit="Zielwert" />
          <Stat value={result.actionCount} unit="Aktionen" />
          <Stat value={result.runCount} unit="Runs" />
          <Stat value={result.successfulRunCount} unit="Erfolgreiche Runs" />
          <Stat value={result.stolenAgendaCount} unit="Gestohlen" />
          <Stat value={result.scoredAgendaCount} unit="Gescored" />
        </div>
        {result.series ? (
          <div
            className={`seriesStrip ${result.series.status === "finished" ? "finished" : "inProgress"}`}
          >
            <div>
              <span>
                Serienspiel {result.series.gameNumber}/
                {result.series.gamesPlanned}
              </span>
              <small>{seriesText}</small>
            </div>
            {seriesScore ? (
              <div
                className="seriesResultScore"
                aria-label={seriesScore.ariaLabel}
              >
                <span className="seriesResultLabel">{seriesScore.label}</span>
                <strong>{seriesScore.score}</strong>
                <small>
                  <span>{seriesViewerScoreLabel}</span>
                  <span>{seriesOpponentScoreLabel}</span>
                </small>
              </div>
            ) : null}
            <div className="seriesScore">
              <span>
                Siege {seriesViewerScoreLabel} {result.series.viewerWins}
              </span>
              <span>
                Siege {seriesOpponentScoreLabel} {result.series.opponentWins}
              </span>
              <span>Draws {result.series.draws}</span>
              <span>
                Agenda {seriesViewerScoreLabel}{" "}
                {result.series.viewerAgendaPoints}
              </span>
              <span>
                Agenda {seriesOpponentScoreLabel}{" "}
                {result.series.opponentAgendaPoints}
              </span>
            </div>
          </div>
        ) : null}
        <div className="gameOverFooter">
          <div>
            <span>
              {observerMode
                ? observerOutcomeText
                : resultFooterOutcomeLabel(result.winner, side, opponentName)}
            </span>
            <small>{shortDiagnosticsHash(result.finalStateHash)}</small>
          </div>
          <div className="gameOverActions">
            {onReplay ? (
              <button className="button" onClick={onReplay} type="button">
                Replay ansehen
              </button>
            ) : null}
            <button
              className="button"
              onClick={() => onRetentionProtection(!retentionProtected)}
              title={retentionUi.title}
              aria-label={retentionUi.title}
            >
              <Save size={15} />
              {retentionUi.label}
            </button>
            <button className="button" onClick={onDismiss}>
              Board ansehen
            </button>
            {onNextSeriesGame ? (
              <button
                className="button primary"
                onClick={onNextSeriesGame}
                disabled={nextSeriesPending}
              >
                {nextSeriesPending ? "Erstelle..." : "Nächstes Serienspiel"}
              </button>
            ) : null}
            <button
              className={`button ${onNextSeriesGame ? "seriesExitButton" : "primary"}`}
              onClick={handleNewMatch}
              title={exitUi.title}
            >
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
    <div
      className={`resultWinnerMotif ${motif} ${motifUi.imageSrc ? "bitmap" : "neutral"}`}
      aria-label={motifUi.ariaLabel}
      role="img"
    >
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
