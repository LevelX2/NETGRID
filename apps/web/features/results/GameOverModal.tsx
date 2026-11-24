import { Award, Save } from "lucide-react";
import type { ApiGameResultSummary, Side } from "@netgrid/shared";
import { useId, useRef, useState } from "react";
import { useFormatter, useTranslations } from "use-intl/react";

import { ConfirmationDialog } from "../app-shell/ConfirmationDialog";
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
  const [confirmingSeriesExit, setConfirmingSeriesExit] = useState(false);
  const exitButtonRef = useRef<HTMLButtonElement>(null);
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
  const gameStanding = gameStandingForResult(result, side);
  const winnerMotif = resultWinnerMotifFor(result.winner);
  const winnerMotifImage =
    winnerMotif === "runner"
      ? "/result-motifs/result-runner-victory.png"
      : winnerMotif === "corp"
        ? "/result-motifs/result-corp-victory.png"
        : undefined;
  const opponent = opponentSide(side);
  const series = result.series;
  const playerSeriesLabel = observerMode ? t("aiA") : playerLabel(side);
  const opponentSeriesLabel = observerMode ? t("aiB") : playerLabel(opponent);
  const seriesHeadline =
    series?.status === "finished"
      ? series.viewerSeriesOutcome === "won"
        ? t("seriesWon", { player: playerSeriesLabel })
        : series.viewerSeriesOutcome === "lost"
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
  const retentionLabel = retentionProtected
    ? t("removeReplayProtection")
    : t("protectReplay");
  const retentionTitle = retentionProtected
    ? t("removeReplayProtectionHelp")
    : t("protectReplayHelp");
  const exitNeedsConfirmation = Boolean(onNextSeriesGame);
  const exitLabel = exitNeedsConfirmation ? t("leaveSeries") : t("backToStart");
  const showExitConfirmation = exitNeedsConfirmation && confirmingSeriesExit;
  const handleNewMatch = () => {
    if (exitNeedsConfirmation) {
      setConfirmingSeriesExit(true);
      return;
    }
    onNewMatch();
  };
  const cancelSeriesExit = () => {
    setConfirmingSeriesExit(false);
    requestAnimationFrame(() => exitButtonRef.current?.focus());
  };
  const confirmSeriesExit = () => {
    setConfirmingSeriesExit(false);
    onNewMatch();
  };
  return (
    <div className={`gameOverOverlay ${result.viewerOutcome}`}>
      <div className="gameOverBackdrop" aria-hidden="true" />
      <section
        className={`gameOverPanel ${winnerMotifImage ? "withMotifHero" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        inert={showExitConfirmation}
      >
        <div
          className={`gameOverHero ${winnerMotifImage ? "withVisualMotif" : ""}`}
        >
          <div className="gameOverHeroCopy">
            <p className="eyebrow">{t(`format.${result.matchFormat}`)}</p>
            <h2 id="game-over-title">{headlineText}</h2>
            <p>{reasonText}</p>
          </div>
          <div className="gameOverScoreboard">
            {series ? (
              <MatchPointScore
                title={t(
                  series.status === "finished" ? "finalScore" : "interimScore",
                )}
                viewer={{
                  label: playerSeriesLabel,
                  points: series.viewerMatchPoints,
                  detail: t("seriesPlayerStats", {
                    wins: series.viewerWins,
                    agenda: series.viewerAgendaPoints,
                  }),
                }}
                opponent={{
                  label: opponentSeriesLabel,
                  points: series.opponentMatchPoints,
                  detail: t("seriesPlayerStats", {
                    wins: series.opponentWins,
                    agenda: series.opponentAgendaPoints,
                  }),
                }}
                note={t("draws", { count: series.draws })}
              />
            ) : null}
            <MatchPointScore
              title={
                series
                  ? t("seriesGame", {
                      game: series.gameNumber,
                      total: series.gamesPlanned,
                    })
                  : t("gameScore")
              }
              viewer={{
                label: playerRoleLabel(side),
                points: gameStanding.viewerMatchPoints,
                timeMs: result.playerTimeMs?.[side],
              }}
              opponent={{
                label: playerRoleLabel(opponent),
                points: gameStanding.opponentMatchPoints,
                timeMs: result.playerTimeMs?.[opponent],
              }}
              compact={Boolean(series)}
            />
          </div>
          <ResultWinnerMotif motif={winnerMotif} />
        </div>
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
              ref={exitButtonRef}
              className={`button ${onNextSeriesGame ? "seriesExitButton" : "primary"}`}
              onClick={handleNewMatch}
              title={exitLabel}
              disabled={nextSeriesPending}
            >
              {exitLabel}
            </button>
          </div>
        </div>
      </section>
      {showExitConfirmation ? (
        <ConfirmationDialog
          request={{
            title: t("leaveSeriesTitle"),
            message: t("leaveSeriesConfirm"),
            confirmLabel: exitLabel,
            tone: "danger",
            onConfirm: confirmSeriesExit,
          }}
          onCancel={cancelSeriesExit}
          onConfirm={confirmSeriesExit}
        />
      ) : null}
    </div>
  );
}

type ScoreParticipant = {
  label: string;
  points: number;
  detail?: string;
  timeMs?: number | undefined;
};

function MatchPointScore({
  title,
  viewer,
  opponent,
  note,
  compact = false,
}: {
  title: string;
  viewer: ScoreParticipant;
  opponent: ScoreParticipant;
  note?: string;
  compact?: boolean;
}) {
  const t = useTranslations("Results.gameOver");
  const headingId = useId();
  return (
    <section
      className={`resultScore ${compact ? "compact" : ""}`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>{t("matchPointScore", { title })}</h3>
      <div className="resultScorePair">
        <ScoreSide participant={viewer} />
        <span className="resultScoreSeparator" aria-hidden="true">
          :
        </span>
        <ScoreSide participant={opponent} />
      </div>
      {note ? <small className="resultScoreNote">{note}</small> : null}
    </section>
  );
}

function ScoreSide({ participant }: { participant: ScoreParticipant }) {
  return (
    <div className="resultScoreSide">
      <span>{participant.label}</span>
      <strong>{participant.points}</strong>
      {participant.detail ? <small>{participant.detail}</small> : null}
      {participant.timeMs !== undefined ? (
        <ResultPlayerTime milliseconds={participant.timeMs} />
      ) : null}
    </div>
  );
}

function ResultPlayerTime({ milliseconds }: { milliseconds: number }) {
  const t = useTranslations("Results.gameOver");
  const format = useFormatter();
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (minutes > 0) {
    parts.push(format.number(minutes, { style: "unit", unit: "minute" }));
  }
  if (seconds > 0 || minutes === 0) {
    parts.push(format.number(seconds, { style: "unit", unit: "second" }));
  }
  return (
    <small className="resultPlayerTime">
      <time dateTime={`PT${totalSeconds}S`}>
        {t("playerTime", { duration: parts.join(" ") })}
      </time>
    </small>
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
