"use client";

import { Activity, Bot, Check, Flag, Layers3, Link2, LockKeyhole } from "lucide-react";

import {
  MATCH_FORMAT_OPTIONS,
  MATCH_SERIES_GAMES_OPTIONS,
  matchCardPoolFromAddons,
  matchCardPoolIncludes,
  matchFormatCardLabel,
  playModeCardLabel,
  type MatchCardPoolSelection,
  type MatchFormatSelection,
  type MatchStartSeriesGames,
  type PlayMode
} from "../../app/match-start";

export function MatchStartChoiceSections({
  playMode,
  matchFormat,
  seriesGamesPlanned,
  matchCardPool,
  onPlayMode,
  onMatchFormat,
  onSeriesGamesPlanned,
  onMatchCardPool
}: {
  playMode: PlayMode;
  matchFormat: MatchFormatSelection;
  seriesGamesPlanned: MatchStartSeriesGames;
  matchCardPool: MatchCardPoolSelection;
  onPlayMode(mode: PlayMode): void;
  onMatchFormat(format: MatchFormatSelection): void;
  onSeriesGamesPlanned(games: MatchStartSeriesGames): void;
  onMatchCardPool(cardPool: MatchCardPoolSelection): void;
}) {
  const includesClassic = matchCardPoolIncludes(matchCardPool, "classic");
  const includesProteus = matchCardPoolIncludes(matchCardPool, "proteus");
  const updateCardPool = (addon: "classic" | "proteus", enabled: boolean) => {
    onMatchCardPool(
      matchCardPoolFromAddons({
        classic: addon === "classic" ? enabled : includesClassic,
        proteus: addon === "proteus" ? enabled : includesProteus
      })
    );
  };
  return (
    <>
      <section className="matchStartSection" aria-label="Spielart">
        <p className="eyebrow">Spielart</p>
        <div className="choiceCardGrid playModeCards">
          {(["human_vs_human", "human_vs_ai", "ai_vs_ai"] as PlayMode[]).map((option) => {
            const label = playModeCardLabel(option);
            const Icon = option === "human_vs_human" ? Link2 : option === "human_vs_ai" ? Bot : Activity;
            return (
              <button
                key={option}
                className={`choiceCard ${playMode === option ? "active" : ""}`}
                onClick={() => onPlayMode(option)}
                type="button"
                aria-pressed={playMode === option}
                data-testid={`play-mode-${option.replaceAll("_", "-")}`}
              >
                <Icon size={18} />
                <span>
                  <strong>{label.title}</strong>
                  <small>{label.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="matchStartSection" aria-label="Spielziel">
        <p className="eyebrow">Format</p>
        <div className="choiceCardGrid formatCards">
          {MATCH_FORMAT_OPTIONS.map((option) => {
            const label = matchFormatCardLabel(option);
            return (
              <button
                key={option}
                className={`choiceCard ${matchFormat === option ? "active" : ""}`}
                onClick={() => onMatchFormat(option)}
                type="button"
                aria-pressed={matchFormat === option}
                data-testid={option === "rules_match" ? "match-format-rules-match" : "match-format-series"}
              >
                <Flag size={18} />
                <span>
                  <strong>{label.title}</strong>
                  <small>{label.description}</small>
                </span>
              </button>
            );
          })}
        </div>
        {matchFormat === "two_game_side_swap" ? (
          <label className="seriesLengthControl">
            <span>
              <strong>Spiele in der Serie</strong>
              <small>Nach jedem Spiel wechseln die Seiten.</small>
            </span>
            <select
              aria-label="Spiele in der Matchserie"
              value={seriesGamesPlanned}
              onChange={(event) => onSeriesGamesPlanned(Number(event.target.value) as MatchStartSeriesGames)}
              data-testid="match-series-games"
            >
              {MATCH_SERIES_GAMES_OPTIONS.map((games) => (
                <option key={games} value={games}>
                  {games} Spiele
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>
      <section className="matchStartSection" aria-label="Kartenpool">
        <p className="eyebrow">Kartenpool</p>
        <div className="matchCardPoolPicker">
          <div className="matchCardPoolBase">
            <Layers3 size={18} />
            <span>
              <strong>Originalset</strong>
              <small>Immer enthalten</small>
            </span>
            <LockKeyhole size={14} aria-hidden="true" />
          </div>
          <div className="matchCardPoolAddons" role="group" aria-label="Zusatzsets">
            <label className={`matchCardPoolAddon ${includesClassic ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={includesClassic}
                onChange={(event) => updateCardPool("classic", event.target.checked)}
                data-testid="match-card-pool-classic"
              />
              <span className="matchCardPoolCheck" aria-hidden="true">
                {includesClassic ? <Check size={14} /> : null}
              </span>
              <span>
                <strong>Classic</strong>
                <small>Zusatzset zulassen</small>
              </span>
            </label>
            <label className={`matchCardPoolAddon ${includesProteus ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={includesProteus}
                onChange={(event) => updateCardPool("proteus", event.target.checked)}
                data-testid="match-card-pool-proteus"
              />
              <span className="matchCardPoolCheck" aria-hidden="true">
                {includesProteus ? <Check size={14} /> : null}
              </span>
              <span>
                <strong>Protheus</strong>
                <small>Zusatzset zulassen</small>
              </span>
            </label>
          </div>
        </div>
      </section>
    </>
  );
}
