"use client";

import { Activity, Bot, Flag, Link2 } from "lucide-react";
import { useTranslations } from "use-intl/react";

import {
  MATCH_FORMAT_OPTIONS,
  MATCH_SERIES_GAMES_OPTIONS,
  matchCardPoolFromAddons,
  matchCardPoolIncludes,
  type MatchCardPoolSelection,
  type MatchFormatSelection,
  type MatchStartSeriesGames,
  type PlayMode,
} from "../../app/match-start";
import { CardSetPicker } from "../cards/CardSetPicker";

export function MatchStartChoiceSections({
  playMode,
  matchFormat,
  seriesGamesPlanned,
  matchCardPool,
  onPlayMode,
  onMatchFormat,
  onSeriesGamesPlanned,
  onMatchCardPool,
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
  const t = useTranslations("MatchStart.choices");
  const includesClassic = matchCardPoolIncludes(matchCardPool, "classic");
  const includesProteus = matchCardPoolIncludes(matchCardPool, "proteus");
  const updateCardPool = (addon: "classic" | "proteus", enabled: boolean) => {
    onMatchCardPool(
      matchCardPoolFromAddons({
        classic: addon === "classic" ? enabled : includesClassic,
        proteus: addon === "proteus" ? enabled : includesProteus,
      }),
    );
  };
  return (
    <>
      <section className="matchStartSection" aria-label={t("playModeTitle")}>
        <p className="eyebrow">{t("playModeTitle")}</p>
        <div className="choiceCardGrid playModeCards">
          {(["human_vs_human", "human_vs_ai", "ai_vs_ai"] as PlayMode[]).map(
            (option) => {
              const Icon =
                option === "human_vs_human"
                  ? Link2
                  : option === "human_vs_ai"
                    ? Bot
                    : Activity;
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
                    <strong>{t(`playMode.${option}.title`)}</strong>
                    <small>{t(`playMode.${option}.description`)}</small>
                  </span>
                </button>
              );
            },
          )}
        </div>
      </section>
      <section className="matchStartSection" aria-label={t("goalAriaLabel")}>
        <p className="eyebrow">{t("formatTitle")}</p>
        <div className="choiceCardGrid formatCards">
          {MATCH_FORMAT_OPTIONS.map((option) => {
            return (
              <button
                key={option}
                className={`choiceCard ${matchFormat === option ? "active" : ""}`}
                onClick={() => onMatchFormat(option)}
                type="button"
                aria-pressed={matchFormat === option}
                data-testid={`match-format-${option.replaceAll("_", "-")}`}
              >
                <Flag size={18} />
                <span>
                  <strong>{t(`format.${option}.title`)}</strong>
                  <small>{t(`format.${option}.description`)}</small>
                </span>
              </button>
            );
          })}
        </div>
        {matchFormat !== "rules_match" ? (
          <label className="seriesLengthControl">
            <span>
              <strong>{t("seriesGames")}</strong>
              <small>
                {matchFormat === "two_game_side_swap"
                  ? t("seriesHelp")
                  : t("repeatHelp")}
              </small>
            </span>
            <select
              aria-label={t("seriesAriaLabel")}
              value={seriesGamesPlanned}
              onChange={(event) =>
                onSeriesGamesPlanned(
                  Number(event.target.value) as MatchStartSeriesGames,
                )
              }
              data-testid="match-series-games"
            >
              {MATCH_SERIES_GAMES_OPTIONS.map((games) => (
                <option key={games} value={games}>
                  {t("gameCount", { count: games })}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>
      <section className="matchStartSection" aria-label={t("cardPool")}>
        <p className="eyebrow">{t("cardPool")}</p>
        <CardSetPicker
          classic={includesClassic}
          proteus={includesProteus}
          baseDescription={t("alwaysIncluded")}
          addonDescription={t("allowAddon")}
          ariaLabel={t("addons")}
          testIdPrefix="match-card-pool"
          onSetChange={(set, enabled) => {
            if (set !== "original") updateCardPool(set, enabled);
          }}
        />
      </section>
    </>
  );
}
