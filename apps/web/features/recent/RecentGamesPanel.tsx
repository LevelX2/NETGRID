"use client";

import { Award, RotateCcw } from "lucide-react";
import type { ApiMatchFormat, ApiRecentGameResult, ApiRecentResultEntry, ApiRecentSeriesResult, Winner } from "@netgrid/shared";
import { recentResultsEmptyText, recentSeriesWinnerLabel, seriesStatusLabel, singleRecentMatchPoints } from "../../app/recent-results-ui";

export function RecentGamesPanel({
  results,
  loading,
  error,
  updatedAt,
  onRefresh
}: {
  results: ApiRecentResultEntry[];
  loading: boolean;
  error: string;
  updatedAt: string | null;
  onRefresh: () => void;
}) {
  return (
    <section className="recentGamesPanel" aria-label="Letzte Spiele" data-testid="recent-games-panel">
      <div className="recentGamesHeader">
        <div>
          <p className="eyebrow">Letzte Spiele</p>
          <h2>Abgeschlossene Ergebnisse</h2>
        </div>
        <button className="button" onClick={onRefresh} type="button" disabled={loading} data-testid="refresh-recent-games">
          <RotateCcw size={14} />
          Aktualisieren
        </button>
      </div>
      {error ? (
        <p className="notice recentGamesNotice" role="status">
          {error}
        </p>
      ) : null}
      {results.length === 0 ? (
        <p className="recentGamesEmpty">{recentResultsEmptyText(loading)}</p>
      ) : (
        <ol className="recentGamesList">
          {results.map((result) => (
            <li key={result.resultId ?? (result.entryType === "series" ? result.seriesId : result.matchId)}>
              {result.entryType === "series" ? <RecentSeriesResultCard result={result} /> : <RecentGameResultCard result={result} />}
            </li>
          ))}
        </ol>
      )}
      {updatedAt ? <p className="recentGamesTimestamp">Zuletzt aktualisiert: {formatLobbyTime(updatedAt)}</p> : null}
    </section>
  );
}

function RecentGameResultCard({ result }: { result: ApiRecentGameResult }) {
  const winnerName = result.winner === "draw" ? "Unentschieden" : result.winner === "runner" ? result.runner.displayName : result.corp.displayName;
  const scoreText = `${result.runner.agendaPoints} : ${result.corp.agendaPoints}`;
  const runnerMatchPoints = result.runner.matchPoints ?? singleRecentMatchPoints(result.winner, "runner", result.runner.agendaPoints);
  const corpMatchPoints = result.corp.matchPoints ?? singleRecentMatchPoints(result.winner, "corp", result.corp.agendaPoints);
  return (
    <article className="recentGameCard">
      <div className="recentGamePrimary">
        <div>
          <p className="recentGameMatchup">
            <strong>{result.runner.displayName}</strong>
            <span>Runner</span>
            <em>gegen</em>
            <strong>{result.corp.displayName}</strong>
            <span>Korp</span>
          </p>
          <p className="recentGameMeta">
            {formatRecentGameDate(result.finishedAt)} · {matchModeLabel(result.matchMode)} · {matchFormatLabel(result.matchFormat)}
            {result.series ? ` · Spiel ${result.series.gameNumber}/${result.series.gamesPlanned}` : ""}
          </p>
        </div>
        <div className="recentGameScore" aria-label={`Endstand Runner ${result.runner.agendaPoints} zu Korp ${result.corp.agendaPoints}`}>
          <span>{scoreText}</span>
          <small>Agenda-Punkte</small>
        </div>
        <div className="recentGameScore matchPoints" aria-label={`Matchpunkte Runner ${runnerMatchPoints} zu Korp ${corpMatchPoints}`}>
          <span>{runnerMatchPoints} : {corpMatchPoints}</span>
          <small>Matchpunkte</small>
        </div>
      </div>
      <div className="recentGameDetails">
        <span>
          <Award size={14} />
          {result.winner === "draw" ? winnerName : `${winnerName} gewinnt`}
        </span>
        <span title={resultReasonLabel(result.reason, result.winner)}>{shortResultReasonLabel(result.reason)}</span>
        <span>{result.actionCount} Aktionen</span>
        <span>{result.runCount} Runs</span>
        <span title={result.finalStateHash}>Hash {result.finalStateHash.slice(0, 8)}</span>
      </div>
      <div className="recentGameDecks">
        <span>{result.runner.deckName ? `Runner-Deck: ${result.runner.deckName}` : "Runner-Deck"}</span>
        <span>{result.corp.deckName ? `Korp-Deck: ${result.corp.deckName}` : "Korp-Deck"}</span>
      </div>
    </article>
  );
}

function RecentSeriesResultCard({ result }: { result: ApiRecentSeriesResult }) {
  const winnerLabel = recentSeriesWinnerLabel(result);
  return (
    <article className="recentGameCard recentSeriesCard">
      <div className="recentGamePrimary">
        <div>
          <p className="recentGameMatchup">
            <strong>{result.players.player_a.displayName}</strong>
            <span>Spieler A</span>
            <em>gegen</em>
            <strong>{result.players.player_b.displayName}</strong>
            <span>Spieler B</span>
          </p>
          <p className="recentGameMeta">
            {formatRecentGameDate(result.finishedAt)} · Matchserie · {result.gamesPlayed}/{result.gamesPlanned} Spiele · {seriesStatusLabel(result.status)}
          </p>
        </div>
        <div className="recentGameScore matchPoints" aria-label={`Serien-Matchpunkte Spieler A ${result.players.player_a.matchPoints} zu Spieler B ${result.players.player_b.matchPoints}`}>
          <span>{result.players.player_a.matchPoints} : {result.players.player_b.matchPoints}</span>
          <small>Matchpunkte</small>
        </div>
        <div className="recentGameScore" aria-label={`Serien-Agenda-Punkte Spieler A ${result.players.player_a.agendaPoints} zu Spieler B ${result.players.player_b.agendaPoints}`}>
          <span>{result.players.player_a.agendaPoints} : {result.players.player_b.agendaPoints}</span>
          <small>Agenda-Punkte</small>
        </div>
      </div>
      <div className="recentGameDetails">
        <span>
          <Award size={14} />
          {winnerLabel}
        </span>
        <span>{result.players.player_a.wins} : {result.players.player_b.wins} Siege</span>
        <span title={result.seriesId}>Serie {result.seriesId.slice(0, 8)}</span>
      </div>
      <ol className="recentSeriesGames">
        {result.games.map((game) => (
          <li key={game.matchId}>
            <span>Spiel {game.gameNumber}</span>
            <span>{game.runnerDisplayName} als Runner {game.runnerAgendaPoints} AP / {game.runnerMatchPoints} MP</span>
            <span>{game.corpDisplayName} als Korp {game.corpAgendaPoints} AP / {game.corpMatchPoints} MP</span>
            <span>{shortResultReasonLabel(game.reason)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function matchFormatLabel(format: ApiMatchFormat): string {
  if (format === "two_game_side_swap") return "Private Matchserie";
  return "Regelmatch";
}

function resultReasonLabel(reason: ApiRecentGameResult["reason"], winner?: Winner): string {
  if (reason === "agenda_points" && winner === "runner") return "Der Runner hat die Pläne der Korp vereitelt.";
  if (reason === "agenda_points" && winner === "corp") return "Die Korp hat ihre Agendas durchgesetzt.";
  if (reason === "agenda_points") return "Die entscheidenden Agenda-Punkte wurden erreicht.";
  if (reason === "bad_publicity_7") return "Die Korp hat 7 Bad Publicity erreicht.";
  if (reason === "corp_deck_empty") return "Die Korp konnte keine Karte mehr ziehen.";
  if (reason === "flatline") return "Der Runner wurde flatlined.";
  if (reason === "draw") return "Beide Seiten erreichen gleichzeitig das Ziel.";
  if (reason === "forfeit") return "Das Spiel wurde durch Aufgabe beendet.";
  if (reason === "time_expired") return "Das Spiel wurde durch abgelaufene Spielerzeit beendet.";
  return "Das Spiel wurde abgeschlossen.";
}

function matchModeLabel(mode: ApiRecentGameResult["matchMode"]): string {
  if (mode === "human_vs_human") return "Mensch vs Mensch";
  if (mode === "human_runner_vs_corp_ai") return "Runner vs Korp-KI";
  return "Korp vs Runner-KI";
}

function shortResultReasonLabel(reason: ApiRecentGameResult["reason"]): string {
  if (reason === "agenda_points") return "Agenda-Ziel";
  if (reason === "bad_publicity_7") return "Bad Publicity";
  if (reason === "corp_deck_empty") return "Korp-Deck leer";
  if (reason === "flatline") return "Flatline";
  if (reason === "draw") return "Unentschieden";
  if (reason === "time_expired") return "Spielerzeit";
  return "Abgeschlossen";
}

function formatRecentGameDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatLobbyTime(value: string | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}
