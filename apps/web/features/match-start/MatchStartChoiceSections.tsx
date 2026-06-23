"use client";

import { Activity, Bot, Flag, Layers3, Link2 } from "lucide-react";

import {
  matchCardPoolCardLabel,
  matchFormatCardLabel,
  playModeCardLabel,
  type MatchCardPoolSelection,
  type MatchFormatSelection,
  type PlayMode
} from "../../app/match-start";

export function MatchStartChoiceSections({
  playMode,
  matchFormat,
  matchCardPool,
  onPlayMode,
  onMatchFormat,
  onMatchCardPool
}: {
  playMode: PlayMode;
  matchFormat: string;
  matchCardPool: string;
  onPlayMode(mode: PlayMode): void;
  onMatchFormat(format: MatchFormatSelection): void;
  onMatchCardPool(cardPool: MatchCardPoolSelection): void;
}) {
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
          {(["rules_match", "two_game_side_swap"] as MatchFormatSelection[]).map((option) => {
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
      </section>
      <section className="matchStartSection" aria-label="Kartenpool">
        <p className="eyebrow">Kartenpool</p>
        <div className="choiceCardGrid formatCards">
          {(["originalset", "originalset_proteus"] as MatchCardPoolSelection[]).map((option) => {
            const label = matchCardPoolCardLabel(option);
            return (
              <button
                key={option}
                className={`choiceCard ${matchCardPool === option ? "active" : ""}`}
                onClick={() => onMatchCardPool(option)}
                type="button"
                aria-pressed={matchCardPool === option}
                data-testid={option === "originalset" ? "match-card-pool-originalset" : "match-card-pool-originalset-proteus"}
              >
                <Layers3 size={18} />
                <span>
                  <strong>{label.title}</strong>
                  <small>{label.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
