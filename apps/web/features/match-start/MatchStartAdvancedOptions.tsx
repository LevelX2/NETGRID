"use client";

import { SlidersHorizontal } from "lucide-react";
import type { TraceRulesProfile } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";

import {
  aiDeckReadinessLabel,
  type HumanAiSideSelection,
  type MatchCardPoolSelection,
} from "../../app/match-start";
import type {
  MatchStartPlayerClockGraceSeconds,
  MatchStartPlayerClockMinutes,
  MatchStartPlayerClockMode,
} from "../../app/match-start-storage";
import {
  DeckSlotSelect,
  type DeckSlotSnapshot,
} from "../decks/DeckSelectionControls";

type AiDifficulty = "easy" | "normal" | "hard";
type AiDeckPolicy =
  | "fixed"
  | "selected"
  | "seeded_random"
  | "same_as_participant_a";
type AiTraceStartMode = "off" | "detailed";
type DeckSlotSource = "snapshot" | "local" | "random_standard";

type MatchStartLocalDeck = {
  deckId: string;
  name: string;
  side: "runner" | "corp";
};

export function MatchStartAdvancedOptions({
  isHumanVsHuman,
  isHumanVsAi,
  isAiVsAi,
  isAiVsAiSeries,
  hasAiOpponent,
  matchCardPool,
  traceRulesProfile,
  humanAiSideSelection,
  countdownSeconds,
  isPublic,
  playerClockMode,
  playerClockMinutes,
  playerClockGraceSeconds,
  playerClockDetailControlsDisabled,
  seed,
  aiTraceStartMode,
  testSetupMode,
  runnerDifficulty,
  corpDifficulty,
  aiDeckPolicy,
  runnerSnapshots,
  corpSnapshots,
  localDecks,
  participantBRunnerDeckSource,
  participantBCorpDeckSource,
  selectedParticipantBRunnerSnapshotId,
  selectedParticipantBCorpSnapshotId,
  selectedParticipantBRunnerLocalDeckId,
  selectedParticipantBCorpLocalDeckId,
  aiSlotDisabled,
  onCountdownSeconds,
  onIsPublic,
  onTraceRulesProfile,
  onPlayerClockMode,
  onPlayerClockMinutes,
  onPlayerClockGraceSeconds,
  onSeed,
  onAiTraceStartMode,
  onTestSetupMode,
  onRunnerDifficulty,
  onCorpDifficulty,
  onAiDeckPolicy,
  onParticipantBRunnerDeckSource,
  onParticipantBCorpDeckSource,
  onSelectedParticipantBRunnerSnapshotId,
  onSelectedParticipantBCorpSnapshotId,
  onSelectedParticipantBRunnerLocalDeckId,
  onSelectedParticipantBCorpLocalDeckId,
  onOpenStandardDeck,
  onOpenLocalDeck,
}: {
  isHumanVsHuman: boolean;
  isHumanVsAi: boolean;
  isAiVsAi: boolean;
  isAiVsAiSeries: boolean;
  hasAiOpponent: boolean;
  matchCardPool: MatchCardPoolSelection;
  traceRulesProfile: TraceRulesProfile;
  humanAiSideSelection: HumanAiSideSelection;
  countdownSeconds: 3 | 5 | 10;
  isPublic: boolean;
  playerClockMode: MatchStartPlayerClockMode;
  playerClockMinutes: MatchStartPlayerClockMinutes;
  playerClockGraceSeconds: MatchStartPlayerClockGraceSeconds;
  playerClockDetailControlsDisabled: boolean;
  seed: string;
  aiTraceStartMode: AiTraceStartMode;
  testSetupMode: boolean;
  runnerDifficulty: AiDifficulty;
  corpDifficulty: AiDifficulty;
  aiDeckPolicy: AiDeckPolicy;
  runnerSnapshots: DeckSlotSnapshot[];
  corpSnapshots: DeckSlotSnapshot[];
  localDecks: MatchStartLocalDeck[];
  participantBRunnerDeckSource: DeckSlotSource;
  participantBCorpDeckSource: DeckSlotSource;
  selectedParticipantBRunnerSnapshotId: string;
  selectedParticipantBCorpSnapshotId: string;
  selectedParticipantBRunnerLocalDeckId: string;
  selectedParticipantBCorpLocalDeckId: string;
  aiSlotDisabled: boolean;
  onCountdownSeconds(seconds: 3 | 5 | 10): void;
  onIsPublic(isPublic: boolean): void;
  onTraceRulesProfile(profile: TraceRulesProfile): void;
  onPlayerClockMode(mode: MatchStartPlayerClockMode): void;
  onPlayerClockMinutes(minutes: MatchStartPlayerClockMinutes): void;
  onPlayerClockGraceSeconds(seconds: MatchStartPlayerClockGraceSeconds): void;
  onSeed(seed: string): void;
  onAiTraceStartMode(mode: AiTraceStartMode): void;
  onTestSetupMode(enabled: boolean): void;
  onRunnerDifficulty(difficulty: AiDifficulty): void;
  onCorpDifficulty(difficulty: AiDifficulty): void;
  onAiDeckPolicy(policy: AiDeckPolicy): void;
  onParticipantBRunnerDeckSource(source: DeckSlotSource): void;
  onParticipantBCorpDeckSource(source: DeckSlotSource): void;
  onSelectedParticipantBRunnerSnapshotId(snapshotId: string): void;
  onSelectedParticipantBCorpSnapshotId(snapshotId: string): void;
  onSelectedParticipantBRunnerLocalDeckId(deckId: string): void;
  onSelectedParticipantBCorpLocalDeckId(deckId: string): void;
  onOpenStandardDeck(standardDeckId: string): void;
  onOpenLocalDeck(deckId: string): void;
}) {
  const t = useTranslations("MatchStart.advanced");
  const includesProteus =
    matchCardPool === "originalset_proteus" ||
    matchCardPool === "originalset_classic_proteus";
  const usesDefaultPool =
    aiDeckPolicy === "fixed" || aiDeckPolicy === "seeded_random";
  const aiReadinessReady = aiDeckReadinessLabel(
    aiDeckPolicy,
    matchCardPool,
  ).ready;
  return (
    <details
      className="advancedMatchOptions"
      data-testid="advanced-match-options"
    >
      <summary>
        <SlidersHorizontal size={15} />
        {t("title")}
      </summary>
      <div className="formGrid advancedMatchGrid">
        {isHumanVsHuman ? (
          <label>
            Countdown
            <select
              value={countdownSeconds}
              onChange={(event) =>
                onCountdownSeconds(Number(event.target.value) as 3 | 5 | 10)
              }
            >
              <option value={3}>{t("seconds", { count: 3 })}</option>
              <option value={5}>{t("seconds", { count: 5 })}</option>
              <option value={10}>{t("seconds", { count: 10 })}</option>
            </select>
          </label>
        ) : null}
        <label className={`deckBuilderToggle ${isPublic ? "checked" : ""}`}>
          <input
            checked={isPublic}
            onChange={(event) => onIsPublic(event.target.checked)}
            type="checkbox"
          />
          {t("publicGame")}
        </label>
        <label className="traceRulesProfileField">
          {t("traceRule")}
          <select
            value={traceRulesProfile}
            onChange={(event) =>
              onTraceRulesProfile(event.target.value as TraceRulesProfile)
            }
            data-testid="trace-rules-profile"
          >
            <option value="modern_open">{t("trace.modern")}</option>
            <option value="classic_blind">{t("trace.classic")}</option>
            <option value="classic_blind_corp_ties">
              {t("trace.classicCorpTies")}
            </option>
          </select>
          <small>
            {traceRulesProfile === "modern_open"
              ? t("trace.modernHelp")
              : traceRulesProfile === "classic_blind"
                ? t("trace.classicHelp")
                : t("trace.classicCorpTiesHelp")}
          </small>
        </label>
        <label>
          {t("playerTime")}
          <select
            value={isAiVsAi ? "none" : playerClockMode}
            onChange={(event) =>
              onPlayerClockMode(event.target.value as MatchStartPlayerClockMode)
            }
            disabled={isAiVsAi}
          >
            <option value="none">{t("noTimeLimit")}</option>
            <option value="player_clock">{t("timeLimitActive")}</option>
          </select>
        </label>
        {isAiVsAi ? <p className="meta">{t("aiNoPlayerTime")}</p> : null}
        <label>
          {t("timePerSide")}
          <select
            value={playerClockMinutes}
            onChange={(event) =>
              onPlayerClockMinutes(
                Number(event.target.value) as MatchStartPlayerClockMinutes,
              )
            }
            disabled={playerClockDetailControlsDisabled}
          >
            {[5, 10, 15, 20, 30, 45].map((minutes) => (
              <option key={minutes} value={minutes}>
                {t("minutes", { count: minutes })}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("gracePerDecision")}
          <select
            value={playerClockGraceSeconds}
            onChange={(event) =>
              onPlayerClockGraceSeconds(
                Number(event.target.value) as MatchStartPlayerClockGraceSeconds,
              )
            }
            disabled={playerClockDetailControlsDisabled}
          >
            {[0, 5, 10, 15, 30].map((seconds) => (
              <option key={seconds} value={seconds}>
                {t("seconds", { count: seconds })}
              </option>
            ))}
          </select>
        </label>
        <label>
          Seed
          <input
            value={seed}
            onChange={(event) => onSeed(event.target.value)}
          />
        </label>
        {isHumanVsAi ? (
          <label
            className={`deckBuilderToggle matchStartTraceToggle ${aiTraceStartMode !== "off" ? "checked" : ""}`}
          >
            <input
              data-testid="match-start-ai-trace-toggle"
              checked={aiTraceStartMode !== "off"}
              onChange={(event) =>
                onAiTraceStartMode(event.target.checked ? "detailed" : "off")
              }
              type="checkbox"
            />
            {t("saveAiTrace")}
          </label>
        ) : null}
        {isHumanVsHuman ? (
          <label
            className={`deckBuilderToggle ${testSetupMode ? "checked" : ""}`}
          >
            <input
              checked={testSetupMode}
              onChange={(event) => onTestSetupMode(event.target.checked)}
              type="checkbox"
            />
            {t("testSetup")}
          </label>
        ) : null}
        {isHumanVsAi && humanAiSideSelection !== "runner" ? (
          <label>
            {t("runnerAi")}
            <select
              value={runnerDifficulty}
              onChange={(event) =>
                onRunnerDifficulty(event.target.value as AiDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {isHumanVsAi && humanAiSideSelection !== "corp" ? (
          <label>
            {t("corpAi")}
            <select
              value={corpDifficulty}
              onChange={(event) =>
                onCorpDifficulty(event.target.value as AiDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        ) : null}
        {hasAiOpponent ? (
          <label>
            {t("aiDecks")}
            <select
              value={aiDeckPolicy}
              onChange={(event) =>
                onAiDeckPolicy(event.target.value as AiDeckPolicy)
              }
            >
              <option value="selected">{t("aiPolicy.selected")}</option>
              <option value="same_as_participant_a">
                {t("aiPolicy.same")}
              </option>
              <option value="fixed">{t("aiPolicy.fixed")}</option>
              <option value="seeded_random">{t("aiPolicy.random")}</option>
            </select>
            <small
              className={`aiDeckReadiness ${aiReadinessReady ? "ready" : "blocked"}`}
              data-testid="ai-deck-readiness"
            >
              <strong>
                {includesProteus
                  ? t(
                      usesDefaultPool
                        ? "readiness.proteusDefaultTitle"
                        : "readiness.proteusSelectedTitle",
                      {
                        status: aiReadinessReady
                          ? t("readiness.ready")
                          : t("readiness.blocked"),
                      },
                    )
                  : t(
                      usesDefaultPool
                        ? "readiness.defaultTitle"
                        : "readiness.selectedTitle",
                    )}
              </strong>
              <span>
                {t(
                  usesDefaultPool
                    ? includesProteus
                      ? "readiness.proteusDefaultDetail"
                      : "readiness.defaultDetail"
                    : includesProteus
                      ? "readiness.proteusSelectedDetail"
                      : "readiness.selectedDetail",
                )}
              </span>
            </small>
          </label>
        ) : null}
      </div>
      {(isHumanVsHuman && testSetupMode) ||
      ((isHumanVsAi || isAiVsAiSeries) && aiDeckPolicy === "selected") ? (
        <div className="deckSlotGrid advancedDeckSlots">
          <>
            <DeckSlotSelect
              label={
                isAiVsAiSeries
                  ? t("aiBRunnerDeck")
                  : hasAiOpponent
                    ? t("aiRunnerDeck")
                    : t("participantBRunnerDeck")
              }
              side="runner"
              snapshots={runnerSnapshots}
              localDecks={localDecks.filter((deck) => deck.side === "runner")}
              source={participantBRunnerDeckSource}
              selectedSnapshotId={selectedParticipantBRunnerSnapshotId}
              selectedLocalDeckId={selectedParticipantBRunnerLocalDeckId}
              disabled={aiSlotDisabled}
              onSource={onParticipantBRunnerDeckSource}
              onSnapshot={onSelectedParticipantBRunnerSnapshotId}
              onLocalDeck={onSelectedParticipantBRunnerLocalDeckId}
              onOpenStandardDeck={onOpenStandardDeck}
              onOpenLocalDeck={onOpenLocalDeck}
            />
            <DeckSlotSelect
              label={
                isAiVsAiSeries
                  ? t("aiBCorpDeck")
                  : hasAiOpponent
                    ? t("aiCorpDeck")
                    : t("participantBCorpDeck")
              }
              side="corp"
              snapshots={corpSnapshots}
              localDecks={localDecks.filter((deck) => deck.side === "corp")}
              source={participantBCorpDeckSource}
              selectedSnapshotId={selectedParticipantBCorpSnapshotId}
              selectedLocalDeckId={selectedParticipantBCorpLocalDeckId}
              disabled={aiSlotDisabled}
              onSource={onParticipantBCorpDeckSource}
              onSnapshot={onSelectedParticipantBCorpSnapshotId}
              onLocalDeck={onSelectedParticipantBCorpLocalDeckId}
              onOpenStandardDeck={onOpenStandardDeck}
              onOpenLocalDeck={onOpenLocalDeck}
            />
          </>
        </div>
      ) : null}
    </details>
  );
}
