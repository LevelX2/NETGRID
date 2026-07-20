"use client";

import { Eye, History, LogIn, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublicMatchEntry } from "../../lib/client-api";
import {
  publicMatchActionLabel,
  publicMatchParticipantLabel,
  publicMatchTarget,
} from "../match-start/public-match-navigation";
import {
  filterAndSortPublicMatches,
  publicGamesFilterLabel,
  type PublicGamesFilter,
} from "./public-games-model";

const FILTERS: PublicGamesFilter[] = ["all", "open", "active", "finished"];

export function PublicGamesPanel({
  matches,
  loading,
  error,
  updatedAt,
  canJoinOpen,
  onRefresh,
  onJoinOpen,
}: {
  matches: PublicMatchEntry[];
  loading: boolean;
  error: string;
  updatedAt: string | null;
  canJoinOpen: boolean;
  onRefresh(): void;
  onJoinOpen(entry: PublicMatchEntry): void;
}) {
  const [filter, setFilter] = useState<PublicGamesFilter>("all");
  const visibleMatches = useMemo(
    () => filterAndSortPublicMatches(matches, filter),
    [filter, matches],
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
        <ol className="publicGamesList">
          {visibleMatches.map((entry) => (
            <li key={entry.matchId}>
              <PublicGameCard
                entry={entry}
                canJoinOpen={canJoinOpen}
                onJoinOpen={onJoinOpen}
              />
            </li>
          ))}
        </ol>
      )}
      {updatedAt ? (
        <p className="publicGamesTimestamp">
          Zuletzt aktualisiert: {formatTime(updatedAt)}
        </p>
      ) : null}
    </section>
  );
}

function PublicGameCard({
  entry,
  canJoinOpen,
  onJoinOpen,
}: {
  entry: PublicMatchEntry;
  canJoinOpen: boolean;
  onJoinOpen(entry: PublicMatchEntry): void;
}) {
  const target = publicMatchTarget(entry);
  const ActionIcon =
    entry.status === "open" ? LogIn : entry.status === "active" ? Eye : History;
  return (
    <article className={`publicGameCard ${entry.status}`}>
      <div className="publicGameMain">
        <div>
          <div className="publicGameTitle">
            <span className={`publicGameStatus ${entry.status}`}>
              {statusLabel(entry.status)}
            </span>
            <strong>{publicMatchParticipantLabel(entry)}</strong>
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
              Host: {entry.hostDisplayName ?? "Teilnehmer A"} · belegt:{" "}
              {sideLabel(entry.hostSide)} · frei:{" "}
              {sideLabel(entry.availableSide)}
            </p>
          ) : null}
          {entry.result ? (
            <p className="publicGameResult">
              Endstand {entry.result.runner.agendaPoints} :{" "}
              {entry.result.corp.agendaPoints} · {winnerLabel(entry)}
            </p>
          ) : null}
        </div>
        <code title={entry.matchId}>{shortMatchId(entry.matchId)}</code>
      </div>
      <div className="publicGameFooter">
        <span>Aktualisiert {formatTime(entry.updatedAt)}</span>
        {entry.status === "open" ? (
          <button
            className="button primary"
            onClick={() => onJoinOpen(entry)}
            type="button"
            disabled={!canJoinOpen}
            title={
              canJoinOpen
                ? "Beitritt vorbereiten"
                : "Beende zuerst dein aktuelles Spiel."
            }
          >
            <ActionIcon size={15} />
            {publicMatchActionLabel(entry.status)}
          </button>
        ) : target ? (
          <Link className="button primary" href={target}>
            <ActionIcon size={15} />
            {publicMatchActionLabel(entry.status)}
          </Link>
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
  if (entry.winner === "runner") return "Runner gewinnt";
  if (entry.winner === "corp") return "Korp gewinnt";
  if (entry.winner === "draw") return "Unentschieden";
  return "beendet";
}

function shortMatchId(matchId: string): string {
  return matchId.length > 16 ? `${matchId.slice(0, 16)}…` : matchId;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
