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
import { useLocale } from "use-intl/react";

import type { PublicMatchEntry } from "../../lib/client-api";
import { formatAppDateTime } from "../../i18n/format";
import type { AppLocale } from "../../i18n/locale";
import {
  publicMatchActionLabel,
  publicGamebookTarget,
  publicMatchParticipantLabel,
  publicMatchTarget,
} from "../match-start/public-match-navigation";
import {
  canRejoinPublicMatch,
  filterAndSortPublicMatches,
  publicGamesFilterLabel,
  publicGamesViewModeLabel,
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
      aria-label="Öffentliche Spiele"
      data-testid="public-games-panel"
    >
      <div className="publicGamesHeader">
        <div>
          <p className="eyebrow">Öffentliche Spiele</p>
          <h2>Offene, laufende und abgeschlossene Spiele</h2>
        </div>
        <button
          className="button"
          onClick={onRefresh}
          type="button"
          disabled={loading}
          data-testid="refresh-public-games"
        >
          <RotateCcw size={14} />
          Aktualisieren
        </button>
      </div>

      <div className="publicGamesToolbar">
        <div className="publicGamesFilters" aria-label="Spiele filtern">
          {FILTERS.map((candidate) => (
            <button
              className={`button ${filter === candidate ? "active" : ""}`}
              key={candidate}
              onClick={() => setFilter(candidate)}
              type="button"
              aria-pressed={filter === candidate}
            >
              {publicGamesFilterLabel(candidate)}
            </button>
          ))}
        </div>
        <div
          className="publicGamesViewToggle"
          role="group"
          aria-label="Darstellung wählen"
        >
          {VIEW_MODES.map((candidate) => (
            <button
              className={`button ${viewMode === candidate ? "active" : ""}`}
              key={candidate}
              onClick={() => setViewMode(candidate)}
              type="button"
              aria-pressed={viewMode === candidate}
            >
              {publicGamesViewModeLabel(candidate)}
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
          {loading ? "Lade öffentliche Spiele ..." : emptyText(filter)}
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
          Zuletzt aktualisiert: {formatTime(updatedAt, locale)}
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
  const target = publicMatchTarget(entry);
  const gamebookTarget = publicGamebookTarget(entry);
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
              {statusLabel(entry.status)}
            </span>
            {entry.status === "finished" ? (
              <strong
                className="publicGameParticipants"
                aria-label={participants
                  .map(
                    (participant) =>
                      `${participant.displayName}, ${sideLabel(participant.side)}${
                        participant.isWinner ? ", Gewinner" : ""
                      }`,
                  )
                  .join(" gegen ")}
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
                        {participant.isWinner ? "Gewinner: " : ""}
                      </span>
                      <span className="publicGameParticipantName">
                        {participant.displayName}
                      </span>
                      <small aria-hidden="true">
                        ({sideLabel(participant.side)})
                      </small>
                    </span>
                  </Fragment>
                ))}
              </strong>
            ) : (
              <strong>{publicMatchParticipantLabel(entry)}</strong>
            )}
          </div>
          <p className="publicGameMeta">
            {matchModeLabel(entry.matchMode)} ·{" "}
            {matchFormatLabel(entry.matchFormat)}
            {entry.seriesGamesPlanned
              ? ` · ${entry.seriesGamesPlanned} Spiele`
              : ""}
            {` · ${cardPoolLabel(entry.cardPool)}`}
          </p>
          {entry.status === "open" ? (
            <p className="publicGameJoinInfo">
              <Users size={14} />
              <span className="publicGameJoinDetails">
                Host: {entry.hostDisplayName ?? "Teilnehmer A"} · belegt:{" "}
                {sideLabel(entry.hostSide)} ·{" "}
              </span>
              <span>frei: {sideLabel(entry.availableSide)}</span>
            </p>
          ) : null}
          {resultScore ? (
            <p className="publicGameResult">
              <span className="publicGameResultScores">
                {resultScore.matchPoints ? (
                  <strong>Matchpunkte {resultScore.matchPoints}</strong>
                ) : null}
                <span>Agenda-Punkte {resultScore.agendaPoints}</span>
              </span>
              <span className="publicGameResultSeparator" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
              <span className="publicGameWinner">{winnerLabel(entry)}</span>
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
                    title={conclusion.label}
                  >
                    {viewMode === "compact"
                      ? conclusion.compactLabel
                      : conclusion.label}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <code title={entry.matchId}>{entry.matchId}</code>
      </div>
      <div className="publicGameFooter">
        <span>Aktualisiert {formatTime(entry.updatedAt, locale)}</span>
        {entry.status === "open" ? (
          <button
            className="button primary"
            onClick={() => onJoinOpen(entry)}
            type="button"
            disabled={!canJoinOpen}
            aria-label={publicMatchActionLabel(entry.status)}
            title={
              canJoinOpen
                ? publicMatchActionLabel(entry.status)
                : "Beende zuerst dein aktuelles Spiel."
            }
          >
            <ActionIcon size={15} />
            <span className="publicGameActionLabel">
              {publicMatchActionLabel(entry.status)}
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
                rejoining ? "Spiel wird fortgesetzt ..." : "Spiel fortsetzen"
              }
              title={
                rejoining ? "Spiel wird fortgesetzt ..." : "Spiel fortsetzen"
              }
            >
              <LogIn size={15} />
              <span className="publicGameActionLabel">
                {rejoining ? "Spiel wird fortgesetzt ..." : "Spiel fortsetzen"}
              </span>
            </button>
            {target ? (
              <Link
                className="button"
                href={target}
                aria-label="Zuschauen"
                title="Zuschauen"
              >
                <Eye size={15} />
                <span className="publicGameActionLabel">Zuschauen</span>
              </Link>
            ) : null}
          </>
        ) : target ? (
          <Link
            className="button primary"
            href={target}
            aria-label={publicMatchActionLabel(entry.status)}
            title={publicMatchActionLabel(entry.status)}
          >
            <ActionIcon size={15} />
            <span className="publicGameActionLabel">
              {publicMatchActionLabel(entry.status)}
            </span>
          </Link>
        ) : null}
        {gamebookTarget ? (
          <a
            className="button"
            href={gamebookTarget}
            aria-label="Spielprotokoll herunterladen"
            title="Spielprotokoll herunterladen"
          >
            <Download size={15} />
            <span className="publicGameActionLabel">
              Spielprotokoll herunterladen
            </span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

function statusLabel(status: PublicMatchEntry["status"]): string {
  if (status === "open") return "Offen";
  if (status === "active") return "Laufend";
  return "Abgeschlossen";
}

function emptyText(filter: PublicGamesFilter): string {
  if (filter === "open") return "Keine offenen Spiele gefunden.";
  if (filter === "active") return "Keine laufenden Spiele gefunden.";
  if (filter === "finished") return "Keine abgeschlossenen Spiele gefunden.";
  return "Keine öffentlichen Spiele gefunden.";
}

function sideLabel(side: PublicMatchEntry["hostSide"]): string {
  if (side === "runner") return "Runner";
  if (side === "corp") return "Korp";
  return "–";
}

function matchModeLabel(mode: PublicMatchEntry["matchMode"]): string {
  if (mode === "human_vs_human") return "Mensch gegen Mensch";
  if (mode === "ai_vs_ai") return "KI gegen KI";
  return "Mensch gegen KI";
}

function matchFormatLabel(format: PublicMatchEntry["matchFormat"]): string {
  if (format === "two_game_side_swap") return "Matchserie";
  if (format === "rules_match") return "Regelmatch";
  return "Einzelspiel";
}

function cardPoolLabel(pool: PublicMatchEntry["cardPool"]): string {
  if (pool === "originalset_classic_proteus")
    return "Originalset + Classic + Proteus";
  if (pool === "originalset_classic") return "Originalset + Classic";
  if (pool === "originalset_proteus") return "Originalset + Proteus";
  return "Originalset";
}

function winnerLabel(entry: PublicMatchEntry): string {
  const winner =
    entry.result?.winnerSide ?? entry.result?.winner ?? entry.winner;
  if (winner === "runner") return "Runner gewinnt";
  if (winner === "corp") return "Korp gewinnt";
  if (winner === "draw" || entry.result?.reason === "draw") {
    return "Unentschieden";
  }
  return "beendet";
}

function formatTime(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatAppDateTime(date, locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
