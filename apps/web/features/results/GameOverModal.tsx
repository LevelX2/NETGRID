import { Award, Save } from "lucide-react";
import type { ApiGameResultSummary, Side } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import { Stat } from "../game-board/ResourceStrip";
import { shortDiagnosticsHash } from "../debug/DiagnosticsDrawer";
import {
  gameStandingForResult,
  resultWinnerMotifFor,
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
  const t = useTranslations("Results.gameOver");
  const sideName = (value: Side) => t(value);
  const playerLabel = (value: Side) => {
    const name = value === side ? playerName?.trim() : opponentName?.trim();
    return name || (value === side ? t("you") : t("opponent"));
  };
  const playerRoleLabel = (value: Side) =>
    t("playerRole", { player: playerLabel(value), side: sideName(value) });
  const observerOutcomeText =
    result.winner === "draw"
      ? t("simulationDraw")
      : t("simulationWin", {
          side: t(result.winner === "runner" ? "runnerAi" : "corpAi"),
        });
  const outcomeText = observerMode
    ? observerOutcomeText
    : result.winner === "draw"
      ? t("outcomeDraw")
      : result.winner === side && !playerName?.trim()
        ? t("youWinAs", { side: sideName(result.winner) })
        : t("playerWinsAs", {
            player: playerLabel(result.winner),
            side: sideName(result.winner),
          });
  const gameStanding = gameStandingForResult(
    result,
    side,
    playerName,
    opponentName,
  );
  const winnerMotif = resultWinnerMotifFor(result.winner);
  const winnerMotifImage =
    winnerMotif === "runner"
      ? "/result-motifs/result-runner-victory.png"
      : winnerMotif === "corp"
        ? "/result-motifs/result-corp-victory.png"
        : undefined;
  const opponentSideLabel = opponentSide(side);
  const playerSeriesLabel = observerMode ? t("aiA") : playerLabel(side);
  const opponentSeriesLabel = observerMode
    ? t("aiB")
    : playerLabel(opponentSideLabel);
  const playerStandingLabel = playerRoleLabel(side);
  const opponentStandingLabel = playerRoleLabel(opponentSideLabel);
  const seriesViewerScoreLabel = observerMode
    ? playerSeriesLabel
    : playerStandingLabel;
  const seriesOpponentScoreLabel = observerMode
    ? opponentSeriesLabel
    : opponentStandingLabel;
  const seriesHeadline =
    result.series?.status === "finished"
      ? result.series.viewerSeriesOutcome === "won"
        ? t("seriesWon", { player: playerSeriesLabel })
        : result.series.viewerSeriesOutcome === "lost"
          ? t("seriesWon", { player: opponentSeriesLabel })
          : t("seriesDraw")
      : null;
  const headlineText = seriesHeadline ?? outcomeText;
  const lastGameOutcomeText =
    result.winner === "draw"
      ? t("outcomeDrawShort")
      : t("sideWins", { side: sideName(result.winner) });
  const resultReason = t(`reason.${result.reason}`);
  const reasonText = seriesHeadline
    ? t("lastGame", { outcome: lastGameOutcomeText, reason: resultReason })
    : resultReason;
  const seriesText = result.series
    ? t("seriesStatus", {
        player: playerSeriesLabel,
        opponent: opponentSeriesLabel,
        playerWins: result.series.viewerWins,
        opponentWins: result.series.opponentWins,
        draws: result.series.draws,
      })
    : null;
  const seriesScoreLabel =
    result.series?.status === "finished" ? t("finalScore") : t("interimScore");
  const retentionLabel = retentionProtected
    ? t("removeReplayProtection")
    : t("protectReplay");
  const retentionTitle = retentionProtected
    ? t("removeReplayProtectionHelp")
    : t("protectReplayHelp");
  const exitNeedsConfirmation = Boolean(onNextSeriesGame);
  const exitLabel = exitNeedsConfirmation ? t("leaveSeries") : t("backToStart");
  const handleNewMatch = () => {
    if (exitNeedsConfirmation && !window.confirm(t("leaveSeriesConfirm"))) {
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
        className={`gameOverPanel ${winnerMotifImage ? "withMotifHero" : ""}`}
      >
        <div
          className={`gameOverHero ${winnerMotifImage ? "withVisualMotif" : ""}`}
        >
          <div className="gameOverHeroCopy">
            <p className="eyebrow">{t(`format.${result.matchFormat}`)}</p>
            <h2 id="game-over-title">{headlineText}</h2>
            <p>{reasonText}</p>
          </div>
          <ResultWinnerMotif motif={winnerMotif} />
        </div>
        {gameStanding ? (
          <div className="gameStandingStrip" aria-label={t("gameScore")}>
            <div>
              <span>{t("gameScore")}</span>
              <small>
                {result.winner === "draw"
                  ? t("standingDraw")
                  : t("standingWinner", {
                      winner: playerRoleLabel(result.winner),
                      loser: playerRoleLabel(opponentSide(result.winner)),
                      points:
                        result.winner === "runner"
                          ? result.corpAgendaPoints
                          : result.runnerAgendaPoints,
                    })}
              </small>
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
            label={t("agenda")}
            value={`${result.runnerAgendaPoints} / ${result.agendaPointsToWin}`}
            unit={t("runner")}
            icon={<AgendaIcon size={14} />}
          />
          <Stat
            label={t("agenda")}
            value={`${result.corpAgendaPoints} / ${result.agendaPointsToWin}`}
            unit={t("corp")}
            icon={<AgendaIcon size={14} />}
          />
          <Stat value={result.agendaPointsToWin} unit={t("targetScore")} />
          <Stat value={result.actionCount} unit={t("actions")} />
          <Stat value={result.runCount} unit={t("runs")} />
          <Stat value={result.successfulRunCount} unit={t("successfulRuns")} />
          <Stat value={result.stolenAgendaCount} unit={t("stolen")} />
          <Stat value={result.scoredAgendaCount} unit={t("scored")} />
        </div>
        {result.series ? (
          <div
            className={`seriesStrip ${result.series.status === "finished" ? "finished" : "inProgress"}`}
          >
            <div>
              <span>
                {t("seriesGame", {
                  game: result.series.gameNumber,
                  total: result.series.gamesPlanned,
                })}
              </span>
              <small>{seriesText}</small>
            </div>
            {result.series ? (
              <div
                className="seriesResultScore"
                aria-label={t("seriesScoreAria", {
                  label: seriesScoreLabel,
                  player: seriesViewerScoreLabel,
                  playerPoints: result.series.viewerMatchPoints,
                  opponent: seriesOpponentScoreLabel,
                  opponentPoints: result.series.opponentMatchPoints,
                })}
              >
                <span className="seriesResultLabel">{seriesScoreLabel}</span>
                <strong>
                  {result.series.viewerMatchPoints} :{" "}
                  {result.series.opponentMatchPoints}
                </strong>
                <small>
                  <span>{seriesViewerScoreLabel}</span>
                  <span>{seriesOpponentScoreLabel}</span>
                </small>
              </div>
            ) : null}
            <div className="seriesScore">
              <span>
                {t("wins", {
                  player: seriesViewerScoreLabel,
                  count: result.series.viewerWins,
                })}
              </span>
              <span>
                {t("wins", {
                  player: seriesOpponentScoreLabel,
                  count: result.series.opponentWins,
                })}
              </span>
              <span>{t("draws", { count: result.series.draws })}</span>
              <span>
                {t("agendaPlayer", {
                  player: seriesViewerScoreLabel,
                  points: result.series.viewerAgendaPoints,
                })}
              </span>
              <span>
                {t("agendaPlayer", {
                  player: seriesOpponentScoreLabel,
                  points: result.series.opponentAgendaPoints,
                })}
              </span>
            </div>
          </div>
        ) : null}
        <div className="gameOverFooter">
          <div>
            <span>
              {observerMode
                ? observerOutcomeText
                : result.winner === "draw"
                  ? t("draw")
                  : result.winner === side
                    ? t("yourSide")
                    : opponentName?.trim() || t("opponent")}
            </span>
            <small>{shortDiagnosticsHash(result.finalStateHash)}</small>
          </div>
          <div className="gameOverActions">
            {onReplay ? (
              <button className="button" onClick={onReplay} type="button">
                {t("viewReplay")}
              </button>
            ) : null}
            <button
              className="button"
              onClick={() => onRetentionProtection(!retentionProtected)}
              title={retentionTitle}
              aria-label={retentionTitle}
            >
              <Save size={15} />
              {retentionLabel}
            </button>
            <button className="button" onClick={onDismiss}>
              {t("viewBoard")}
            </button>
            {onNextSeriesGame ? (
              <button
                className="button primary"
                onClick={onNextSeriesGame}
                disabled={nextSeriesPending}
              >
                {nextSeriesPending ? t("creating") : t("nextSeriesGame")}
              </button>
            ) : null}
            <button
              className={`button ${onNextSeriesGame ? "seriesExitButton" : "primary"}`}
              onClick={handleNewMatch}
              title={exitLabel}
            >
              {exitLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultWinnerMotif({ motif }: { motif: ResultWinnerMotifKind }) {
  const t = useTranslations("Results.gameOver");
  const imageSrc =
    motif === "runner"
      ? "/result-motifs/result-runner-victory.png"
      : motif === "corp"
        ? "/result-motifs/result-corp-victory.png"
        : undefined;
  return (
    <div
      className={`resultWinnerMotif ${motif} ${imageSrc ? "bitmap" : "neutral"}`}
      aria-label={t(`motifAria.${motif}`)}
      role="img"
    >
      <div className="resultMotifFrame">
        {imageSrc ? (
          <img src={imageSrc} alt="" aria-hidden="true" />
        ) : (
          <>
            <span className="resultMotifCore" />
            <span className="resultMotifTrack one" />
            <span className="resultMotifTrack two" />
            <span className="resultMotifTrack three" />
          </>
        )}
      </div>
      <span>{t(`motifCaption.${motif}`)}</span>
    </div>
  );
}
