"use client";

import {
  Crown,
  Download,
  Eye,
  History,
  LogIn,
  RotateCcw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useLocale, useTranslations } from "use-intl/react";

import type { PublicMatchEntry } from "../../lib/client-api";
import { formatAppDateTime } from "../../i18n/format";
import type { AppLocale } from "../../i18n/locale";
import {
  publicGamebookTarget,
  publicMatchTarget,
} from "../match-start/public-match-navigation";
import {
  canRejoinPublicMatch,
  filterAndSortPublicMatches,
  publicMatchConclusion,
  publicMatchParticipants,
  publicMatchResultScore,
  type PublicGamesFilter,
  type PublicGamesViewMode,
} from "./public-games-model";

const FILTERS: PublicGamesFilter[] = ["all", "open", "active", "finished"];
const VIEW_MODES: PublicGamesViewMode[] = ["detailed", "compact"];

export function PublicGamesPanel({
  matches,
  loading,
  error,
  updatedAt,
  canJoinOpen,
  rejoinableMatchIds,
  rejoiningMatchId,
  onRefresh,
  onJoinOpen,
  onRejoin,
}: {
  matches: PublicMatchEntry[];
  loading: boolean;
  error: string;
  updatedAt: string | null;
  canJoinOpen: boolean;
  rejoinableMatchIds: readonly string[];
  rejoiningMatchId: string | null;
  onRefresh(): void;
  onJoinOpen(entry: PublicMatchEntry): void;
  onRejoin(entry: PublicMatchEntry): void;
}) {
  const locale = useLocale();
  const t = useTranslations("Games.public");
  const [filter, setFilter] = useState<PublicGamesFilter>("all");
  const [viewMode, setViewMode] = useState<PublicGamesViewMode>("detailed");
  const visibleMatches = useMemo(
    () => filterAndSortPublicMatches(matches, filter),
    [filter, matches],
  );
  const rejoinableMatchIdSet = useMemo(
    () => new Set(rejoinableMatchIds),
    [rejoinableMatchIds],
  );

  return (
    <section
      className="publicGamesPanel"
      aria-label={t("title")}
      data-testid="public-games-panel"
    >
      <div className="publicGamesHeader">
        <div>
          <p className="eyebrow">{t("title")}</p>
          <h2>{t("subtitle")}</h2>
        </div>
        <button
          className="button"
          onClick={onRefresh}
          type="button"
          disabled={loading}
          data-testid="refresh-public-games"
        >
          <RotateCcw size={14} />
          {t("refresh")}
        </button>
      </div>

      <div className="publicGamesToolbar">
        <div className="publicGamesFilters" aria-label={t("filterAriaLabel")}>
          {FILTERS.map((candidate) => (
            <button
              className={`button ${filter === candidate ? "active" : ""}`}
              key={candidate}
              onClick={() => setFilter(candidate)}
              type="button"
              aria-pressed={filter === candidate}
            >
              {t(`filter.${candidate}`)}
            </button>
          ))}
        </div>
        <div
          className="publicGamesViewToggle"
          role="group"
          aria-label={t("viewAriaLabel")}
        >
          {VIEW_MODES.map((candidate) => (
            <button
              className={`button ${viewMode === candidate ? "active" : ""}`}
              key={candidate}
              onClick={() => setViewMode(candidate)}
              type="button"
              aria-pressed={viewMode === candidate}
            >
              {t(`view.${candidate}`)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="notice publicGamesNotice" role="status">
          {error}
        </p>
      ) : null}
      {visibleMatches.length === 0 ? (
        <p className="publicGamesEmpty">
          {loading ? t("loading") : t(`empty.${filter}`)}
        </p>
      ) : (
        <ol className={`publicGamesList ${viewMode}`}>
          {visibleMatches.map((entry) => (
            <li key={entry.matchId}>
              <PublicGameCard
                entry={entry}
                canJoinOpen={canJoinOpen}
                canRejoin={canRejoinPublicMatch(entry, rejoinableMatchIdSet)}
                rejoining={rejoiningMatchId === entry.matchId}
                viewMode={viewMode}
                locale={locale}
                onJoinOpen={onJoinOpen}
                onRejoin={onRejoin}
              />
            </li>
          ))}
        </ol>
      )}
      {updatedAt ? (
        <p className="publicGamesTimestamp">
          {t("lastUpdated", {date: formatTime(updatedAt, locale)})}
        </p>
      ) : null}
    </section>
  );
}

function PublicGameCard({
  entry,
  canJoinOpen,
  canRejoin,
  rejoining,
  viewMode,
  locale,
  onJoinOpen,
  onRejoin,
}: {
  entry: PublicMatchEntry;
  canJoinOpen: boolean;
  canRejoin: boolean;
  rejoining: boolean;
  viewMode: PublicGamesViewMode;
  locale: AppLocale;
  onJoinOpen(entry: PublicMatchEntry): void;
  onRejoin(entry: PublicMatchEntry): void;
}) {
  const t = useTranslations("Games.public");
  const target = publicMatchTarget(entry);
  const gamebookTarget = publicGamebookTarget(entry, locale);
  const resultScore = publicMatchResultScore(entry);
  const conclusion = publicMatchConclusion(entry);
  const participants = publicMatchParticipants(entry);
  const ActionIcon =
    entry.status === "open" ? LogIn : entry.status === "active" ? Eye : History;
  return (
    <article className={`publicGameCard ${entry.status} ${viewMode}`}>
      <div className="publicGameMain">
        <div>
          <div className="publicGameTitle">
            <span className={`publicGameStatus ${entry.status}`}>
              {t(`status.${entry.status}`)}
            </span>
            {entry.status === "finished" ? (
              <strong
                className="publicGameParticipants"
                aria-label={participants
                  .map(
                    (participant) =>
                      `${participant.displayName}, ${t(`side.${participant.side}`)}${
                        participant.isWinner ? `, ${t("winner")}` : ""
                      }`,
                  )
                  .join(` ${t("versus")} `)}
              >
                {participants.map((participant, index) => (
                  <Fragment key={participant.side}>
                    {index > 0 ? (
                      <span className="publicGameVersus" aria-hidden="true">
                        vs
                      </span>
                    ) : null}
                    <span
                      className={`publicGameParticipant ${participant.side}${
                        participant.isWinner ? " winner" : ""
                      }`}
                    >
                      {participant.isWinner ? (
                        <Crown
                          className="publicGameWinnerCrown"
                          size={14}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="srOnly">
                        {participant.isWinner ? `${t("winner")}: ` : ""}
                      </span>
                      <span className="publicGameParticipantName">
                        {participant.displayName}
                      </span>
                      <small aria-hidden="true">
                        ({t(`side.${participant.side}`)})
                      </small>
                    </span>
                  </Fragment>
                ))}
              </strong>
            ) : (
              <strong>{[entry.participantNames.runner, entry.participantNames.corp].filter(Boolean).join(" vs ") || t("participantsPreparing")}</strong>
            )}
          </div>
          <p className="publicGameMeta">
            {t(`matchMode.${entry.matchMode}`)} ·{" "}
            {t(`matchFormat.${entry.matchFormat}`)}
            {entry.seriesGamesPlanned
              ? ` · ${t("gameCount", {count: entry.seriesGamesPlanned})}`
              : ""}
            {` · ${t(`cardPool.${entry.cardPool}`)}`}
          </p>
          {entry.status === "open" ? (
            <p className="publicGameJoinInfo">
              <Users size={14} />
              <span className="publicGameJoinDetails">
                {t("host")}: {entry.hostDisplayName ?? t("participantA")} · {t("occupied")}: {" "}
                {entry.hostSide ? t(`side.${entry.hostSide}`) : "–"} ·{" "}
              </span>
              <span>{t("available")}: {entry.availableSide ? t(`side.${entry.availableSide}`) : "–"}</span>
            </p>
          ) : null}
          {resultScore ? (
            <p className="publicGameResult">
              <span className="publicGameResultScores">
                {resultScore.matchPoints ? (
                  <strong>{t("matchPoints")} {resultScore.matchPoints}</strong>
                ) : null}
                <span>{t("agendaPoints")} {resultScore.agendaPoints}</span>
              </span>
              <span className="publicGameResultSeparator" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
              <span className="publicGameWinner">{t(winnerMessageKey(entry))}</span>
              {conclusion ? (
                <>
                  <span
                    className="publicGameConclusionSeparator"
                    aria-hidden="true"
                  >
                    {" "}
                    ·{" "}
                  </span>
                  <span
                    className={`publicGameConclusion ${conclusion.kind}`}
                    title={t(`conclusion.${conclusion.kind}`)}
                  >
                    {viewMode === "compact"
                      ? t(`conclusionCompact.${conclusion.kind}`)
                      : t(`conclusion.${conclusion.kind}`)}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <code title={entry.matchId}>{entry.matchId}</code>
      </div>
      <div className="publicGameFooter">
        <span>{t("updated", {date: formatTime(entry.updatedAt, locale)})}</span>
        {entry.status === "open" ? (
          <button
            className="button primary"
            onClick={() => onJoinOpen(entry)}
            type="button"
            disabled={!canJoinOpen}
            aria-label={t(`action.${entry.status}`)}
            title={
              canJoinOpen
                ? t(`action.${entry.status}`)
                : t("finishCurrentFirst")
            }
          >
            <ActionIcon size={15} />
            <span className="publicGameActionLabel">
              {t(`action.${entry.status}`)}
            </span>
          </button>
        ) : canRejoin ? (
          <>
            <button
              className="button primary"
              onClick={() => onRejoin(entry)}
              type="button"
              disabled={rejoining}
              aria-label={
                rejoining ? t("rejoining") : t("rejoin")
              }
              title={
                rejoining ? t("rejoining") : t("rejoin")
              }
            >
              <LogIn size={15} />
              <span className="publicGameActionLabel">
                {rejoining ? t("rejoining") : t("rejoin")}
              </span>
            </button>
            {target ? (
              <Link
                className="button"
                href={target}
                aria-label={t("action.active")}
                title={t("action.active")}
              >
                <Eye size={15} />
                <span className="publicGameActionLabel">{t("action.active")}</span>
              </Link>
            ) : null}
          </>
        ) : target ? (
          <Link
            className="button primary"
            href={target}
            aria-label={t(`action.${entry.status}`)}
            title={t(`action.${entry.status}`)}
          >
            <ActionIcon size={15} />
            <span className="publicGameActionLabel">
              {t(`action.${entry.status}`)}
            </span>
          </Link>
        ) : null}
        {gamebookTarget ? (
          <a
            className="button"
            href={gamebookTarget}
            aria-label={t("downloadGamebook")}
            title={t("downloadGamebook")}
          >
            <Download size={15} />
            <span className="publicGameActionLabel">
              {t("downloadGamebook")}
            </span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

function winnerMessageKey(entry: PublicMatchEntry): "runnerWins" | "corpWins" | "draw" | "ended" {
  const winner =
    entry.result?.winnerSide ?? entry.result?.winner ?? entry.winner;
  if (winner === "runner") return "runnerWins";
  if (winner === "corp") return "corpWins";
  if (winner === "draw" || entry.result?.reason === "draw") {
    return "draw";
  }
  return "ended";
}

function formatTime(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatAppDateTime(date, locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
