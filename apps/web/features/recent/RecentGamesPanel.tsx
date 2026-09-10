"use client";

import {
  Award,
  BadgeCheck,
  Bot,
  Download,
  RotateCcw,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "use-intl/react";
import type {
  ApiMatchFormat,
  ApiPlayerIdentityKind,
  ApiRecentGameResult,
  ApiRecentResultEntry,
  ApiRecentSeriesResult,
  Winner,
} from "@netgrid/shared";
import { formatAppDateTime } from "../../i18n/format";
import type { AppLocale } from "../../i18n/locale";
import { singleRecentMatchPoints } from "../../app/recent-results-ui";
import { gamebookDownloadTarget } from "../match-start/public-match-navigation";

export function RecentGamesPanel({
  results,
  loading,
  error,
  updatedAt,
  accountMode,
  onRefresh,
}: {
  results: ApiRecentResultEntry[];
  loading: boolean;
  error: string;
  updatedAt: string | null;
  accountMode: boolean;
  onRefresh: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Games.recent");
  return (
    <section
      className="recentGamesPanel"
      aria-label={t("title")}
      data-testid="recent-games-panel"
    >
      <div className="recentGamesHeader">
        <div>
          <p className="eyebrow">{t("title")}</p>
          <h2>{t("subtitle")}</h2>
        </div>
        <button
          className="button"
          onClick={onRefresh}
          type="button"
          disabled={loading || !accountMode}
          data-testid="refresh-recent-games"
        >
          <RotateCcw size={14} />
          {t("refresh")}
        </button>
      </div>
      {!accountMode ? (
        <p className="recentGamesEmpty">{t("signInHelp")}</p>
      ) : error ? (
        <p className="notice recentGamesNotice" role="status">
          {error}
        </p>
      ) : null}
      {accountMode && results.length === 0 ? (
        <p className="recentGamesEmpty">
          {loading ? t("loading") : t("empty")}
        </p>
      ) : accountMode ? (
        <ol className="recentGamesList">
          {results.map((result) => (
            <li
              key={
                result.resultId ??
                (result.entryType === "series"
                  ? result.seriesId
                  : result.matchId)
              }
            >
              {result.entryType === "series" ? (
                <RecentSeriesResultCard result={result} locale={locale} />
              ) : (
                <RecentGameResultCard result={result} locale={locale} />
              )}
            </li>
          ))}
        </ol>
      ) : null}
      {accountMode && updatedAt ? (
        <p className="recentGamesTimestamp">
          {t("lastUpdated", { date: formatLobbyTime(updatedAt, locale) })}
        </p>
      ) : null}
    </section>
  );
}

function RecentGameResultCard({
  result,
  locale,
}: {
  result: ApiRecentGameResult;
  locale: AppLocale;
}) {
  const t = useTranslations("Games.recent");
  const winnerName =
    result.winner === "draw"
      ? t("draw")
      : result.winner === "runner"
        ? result.runner.displayName
        : result.corp.displayName;
  const scoreText = `${result.runner.agendaPoints} : ${result.corp.agendaPoints}`;
  const runnerMatchPoints =
    result.runner.matchPoints ??
    singleRecentMatchPoints(
      result.winner,
      "runner",
      result.runner.agendaPoints,
    );
  const corpMatchPoints =
    result.corp.matchPoints ??
    singleRecentMatchPoints(result.winner, "corp", result.corp.agendaPoints);
  return (
    <article className="recentGameCard">
      <div className="recentGamePrimary">
        <div>
          <p className="recentGameMatchup">
            <strong>{result.runner.displayName}</strong>
            <PlayerIdentityBadge kind={result.runner.identityKind} />
            <span>{t("runner")}</span>
            <em>{t("versus")}</em>
            <strong>{result.corp.displayName}</strong>
            <PlayerIdentityBadge kind={result.corp.identityKind} />
            <span>{t("corp")}</span>
          </p>
          <p className="recentGameMeta">
            {formatRecentGameDate(result.finishedAt, locale)} ·{" "}
            {t(`matchMode.${result.matchMode}`)} ·{" "}
            {t(`matchFormat.${result.matchFormat}`)}
            {result.series
              ? ` · ${t("gameNumber", { number: result.series.gameNumber, total: result.series.gamesPlanned })}`
              : ""}
          </p>
        </div>
        <div
          className="recentGameScore"
          aria-label={t("agendaScoreAria", {
            runner: result.runner.agendaPoints,
            corp: result.corp.agendaPoints,
          })}
        >
          <span>{scoreText}</span>
          <small>{t("agendaPoints")}</small>
        </div>
        <div
          className="recentGameScore matchPoints"
          aria-label={t("matchScoreAria", {
            runner: runnerMatchPoints,
            corp: corpMatchPoints,
          })}
        >
          <span>
            {runnerMatchPoints} : {corpMatchPoints}
          </span>
          <small>{t("matchPoints")}</small>
        </div>
      </div>
      <MatchId matchId={result.matchId} />
      <div className="recentGameDetails">
        <span>
          <Award size={14} />
          {result.winner === "draw"
            ? winnerName
            : t("wins", { name: winnerName })}
        </span>
        <span
          title={
            resultReasonLabelKey(result.reason, result.winner)
              ? t(resultReasonLabelKey(result.reason, result.winner)!)
              : t("reason.unknown")
          }
        >
          {t(`reasonShort.${result.reason}`)}
        </span>
        <span>{t("actionCount", { count: result.actionCount })}</span>
        <span>{t("runCount", { count: result.runCount })}</span>
        <span title={result.finalStateHash}>
          {t("hash")} {result.finalStateHash.slice(0, 8)}
        </span>
      </div>
      <div className="recentGameDecks">
        <span>
          {result.runner.deckName
            ? t("runnerDeckNamed", { name: result.runner.deckName })
            : t("runnerDeck")}
        </span>
        <span>
          {result.corp.deckName
            ? t("corpDeckNamed", { name: result.corp.deckName })
            : t("corpDeck")}
        </span>
        {result.isPublic ? (
          <>
            <Link
              className="button"
              href={`/replays?matchId=${encodeURIComponent(result.matchId)}`}
            >
              {t("viewReplay")}
            </Link>
            <a
              className="button"
              href={gamebookDownloadTarget(result.matchId, locale)}
            >
              <Download size={15} />
              {t("downloadGamebook")}
            </a>
          </>
        ) : null}
      </div>
    </article>
  );
}

function RecentSeriesResultCard({
  result,
  locale,
}: {
  result: ApiRecentSeriesResult;
  locale: AppLocale;
}) {
  const t = useTranslations("Games.recent");
  const winnerLabel =
    result.outcome === "draw"
      ? t("seriesDraw")
      : t("seriesWinner", { name: result.players[result.outcome].displayName });
  return (
    <article className="recentGameCard recentSeriesCard">
      <div className="recentGamePrimary">
        <div>
          <p className="recentGameMatchup">
            <strong>{result.players.player_a.displayName}</strong>
            <PlayerIdentityBadge kind={result.players.player_a.identityKind} />
            <span>{t("playerA")}</span>
            <em>{t("versus")}</em>
            <strong>{result.players.player_b.displayName}</strong>
            <PlayerIdentityBadge kind={result.players.player_b.identityKind} />
            <span>{t("playerB")}</span>
          </p>
          <p className="recentGameMeta">
            {formatRecentGameDate(result.finishedAt, locale)} ·{" "}
            {t("matchSeries")} ·{" "}
            {t("seriesGames", {
              played: result.gamesPlayed,
              planned: result.gamesPlanned,
            })}{" "}
            · {t(`seriesStatus.${result.status}`)}
          </p>
        </div>
        <div
          className="recentGameScore matchPoints"
          aria-label={t("seriesMatchScoreAria", {
            playerA: result.players.player_a.matchPoints,
            playerB: result.players.player_b.matchPoints,
          })}
        >
          <span>
            {result.players.player_a.matchPoints} :{" "}
            {result.players.player_b.matchPoints}
          </span>
          <small>{t("matchPoints")}</small>
        </div>
        <div
          className="recentGameScore"
          aria-label={t("seriesAgendaScoreAria", {
            playerA: result.players.player_a.agendaPoints,
            playerB: result.players.player_b.agendaPoints,
          })}
        >
          <span>
            {result.players.player_a.agendaPoints} :{" "}
            {result.players.player_b.agendaPoints}
          </span>
          <small>{t("agendaPoints")}</small>
        </div>
      </div>
      <div className="recentGameDetails">
        <span>
          <Award size={14} />
          {winnerLabel}
        </span>
        <span>
          {t("seriesWins", {
            playerA: result.players.player_a.wins,
            playerB: result.players.player_b.wins,
          })}
        </span>
        <span title={result.seriesId}>
          {t("seriesId", { id: result.seriesId.slice(0, 8) })}
        </span>
      </div>
      <ol className="recentSeriesGames">
        {result.games.map((game) => (
          <li key={game.matchId}>
            <span>{t("game", { number: game.gameNumber })}</span>
            <span>
              {t("seriesRunnerLine", {
                name: game.runnerDisplayName,
                agenda: game.runnerAgendaPoints,
                match: game.runnerMatchPoints,
              })}
            </span>
            <span>
              {t("seriesCorpLine", {
                name: game.corpDisplayName,
                agenda: game.corpAgendaPoints,
                match: game.corpMatchPoints,
              })}
            </span>
            <span>{t(`reasonShort.${game.reason}`)}</span>
            {game.isPublic ? (
              <>
                <Link
                  href={`/replays?matchId=${encodeURIComponent(game.matchId)}`}
                >
                  {t("viewReplay")}
                </Link>
                <a href={gamebookDownloadTarget(game.matchId, locale)}>
                  {t("downloadGamebook")}
                </a>
              </>
            ) : null}
            <MatchId matchId={game.matchId} className="recentSeriesMatchId" />
          </li>
        ))}
      </ol>
    </article>
  );
}

function MatchId({
  matchId,
  className = "",
}: {
  matchId: string;
  className?: string;
}) {
  const t = useTranslations("Games.recent");
  const missing = matchId.trim().length === 0;
  return (
    <p
      className={`recentMatchId ${missing ? "isMissing" : ""} ${className}`.trim()}
      {...(missing ? { role: "status" as const } : {})}
    >
      <span>{t("matchId")}:</span>
      {missing ? (
        <strong>{t("missingMatchId")}</strong>
      ) : (
        <code>{matchId}</code>
      )}
    </p>
  );
}

function PlayerIdentityBadge({
  kind = "guest",
}: {
  kind: ApiPlayerIdentityKind | undefined;
}) {
  const t = useTranslations("Games.recent");
  const label = t(`identity.${kind ?? "guest"}`);
  const Icon =
    kind === "account" ? BadgeCheck : kind === "ai" ? Bot : UserRound;
  return (
    <span
      className={`playerIdentityBadge ${kind}`}
      aria-label={t("identityAria", { label })}
      title={
        kind === "account"
          ? t("identityTitle.account")
          : kind === "ai"
            ? t("identityTitle.ai")
            : t("identityTitle.guest")
      }
    >
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

function resultReasonLabelKey(
  reason: ApiRecentGameResult["reason"],
  winner?: Winner,
):
  | "reason.agendaRunner"
  | "reason.agendaCorp"
  | "reason.agenda"
  | `reason.${ApiRecentGameResult["reason"]}`
  | null {
  if (reason === "agenda_points" && winner === "runner")
    return "reason.agendaRunner";
  if (reason === "agenda_points" && winner === "corp")
    return "reason.agendaCorp";
  if (reason === "agenda_points") return "reason.agenda";
  return `reason.${reason}`;
}

function formatRecentGameDate(value: string, locale: AppLocale): string {
  return formatAppDateTime(value, locale, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLobbyTime(value: string | undefined, locale: AppLocale): string {
  if (!value) return "";
  return formatAppDateTime(value, locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
