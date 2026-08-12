import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  eventMayChangeArchives,
  findLastHistoryIndex,
  isArchivesAccessEvent,
  mergedPublicHistory,
} from "./public-event-history";
import { runnerPressureVariationBucket } from "../runner-run-target-guidance";

type RunnerArchivesServer = AiDecisionInput["playerView"]["servers"][number];

type RunnerArchivesEvaluation = {
  accessServerId: string;
  pathPassability?: string;
};

export type RunnerArchivesScoreDependencies = {
  evaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerArchivesEvaluation | undefined;
  definitionType: (definitionId: string) => string | undefined;
};

export function runnerArchivesScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  server: RunnerArchivesServer | undefined,
  dependencies: RunnerArchivesScoreDependencies,
): AiDecisionScoreComponent[] {
  if (
    dependencies.evaluationForAction(input, action)?.accessServerId !==
    "archives"
  )
    return [];
  const root = server?.root ?? [];
  const knownRoot = root.filter(
    (card) => card.known && typeof card.definitionId === "string",
  );
  const knownAgenda = knownRoot.some((card) => {
    const definitionId = card.definitionId;
    return (
      card.type === "agenda" ||
      (definitionId !== undefined &&
        dependencies.definitionType(definitionId) === "agenda")
    );
  });
  const hiddenArchivesCount = Math.max(
    0,
    input.playerView.opponent.discardCount - knownRoot.length,
  );
  if (knownAgenda) {
    return [
      {
        key: "runner_archives_visible_agenda",
        label: "Archives offene Agenda",
        value: 1250,
        reason: "known_archives_agenda",
      },
    ];
  }
  if (hiddenArchivesCount > 0) {
    const payoff = hiddenArchivesPayoffAssessment(input, hiddenArchivesCount);
    if (!payoff.qualified) return [];
    return [
      {
        key: "runner_archives_hidden_information",
        label: "Archives enthält verdeckte Information",
        value: payoff.value,
        reason: [
          `hidden_archives:${hiddenArchivesCount}`,
          `corp_deck_count:${input.playerView.opponent.deckCount}`,
          `runner_agenda_points:${input.playerView.own.agendaPoints}`,
          `archives_corp_deck_pressure:${payoff.corpDeckPressure}`,
          `archives_runner_matchpoint:${payoff.runnerMatchpoint}`,
          `archives_random_discard_unseen:${payoff.randomDiscard}`,
          `archives_hidden_accumulation:${payoff.hiddenAccumulation}`,
          `archives_seeded_probe:${payoff.speculativeProbe}`,
          `archives_hidden_information_qualified:${payoff.reason}`,
        ].join("|"),
      },
    ];
  }
  return [];
}

export function runnerArchivesHasQualifiedHiddenPayoff(
  input: AiDecisionInput,
): boolean {
  const hiddenArchivesCount = runnerHiddenArchivesCount(input);
  return hiddenArchivesPayoffAssessment(input, hiddenArchivesCount).qualified;
}

function runnerHiddenArchivesCount(input: AiDecisionInput): number {
  const knownRootCount =
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.filter(
        (card) => card.known && typeof card.definitionId === "string",
      ).length ?? 0;
  return Math.max(0, input.playerView.opponent.discardCount - knownRootCount);
}

function hiddenArchivesPayoffAssessment(
  input: AiDecisionInput,
  hiddenArchivesCount: number,
): {
  qualified: boolean;
  value: number;
  reason: string;
  corpDeckPressure: boolean;
  runnerMatchpoint: boolean;
  randomDiscard: boolean;
  hiddenAccumulation: boolean;
  speculativeProbe: boolean;
} {
  const corpDeckPressure = input.playerView.opponent.deckCount <= 6;
  const runnerMatchpoint =
    input.playerView.own.agendaPoints >=
    Math.max(1, input.playerView.agendaPointsToWin - 1);
  const randomDiscard = unresolvedRandomCorpDiscard(input);
  const hiddenAccumulation = hiddenArchivesCount >= 10;
  const speculativeProbe =
    !randomDiscard &&
    !runnerMatchpoint &&
    !corpDeckPressure &&
    !hiddenAccumulation &&
    runnerArchivesSpeculativeProbeDisposition(input).admitted;
  const reason = randomDiscard
    ? "unseen_random_discard"
    : runnerMatchpoint
      ? "runner_matchpoint"
      : corpDeckPressure
        ? "corp_deck_pressure"
        : hiddenAccumulation
          ? "large_hidden_accumulation"
          : speculativeProbe
            ? "seeded_one_in_eight_probe"
            : "ordinary_hidden_discard";
  const value = randomDiscard
    ? 480
    : runnerMatchpoint
      ? 420
      : corpDeckPressure
        ? 260
        : hiddenAccumulation
          ? 120
          : speculativeProbe
            ? 35
            : 0;
  return {
    qualified:
      hiddenArchivesCount > 0 &&
      (randomDiscard ||
        runnerMatchpoint ||
        corpDeckPressure ||
        hiddenAccumulation ||
        speculativeProbe),
    value,
    reason,
    corpDeckPressure,
    runnerMatchpoint,
    randomDiscard,
    hiddenAccumulation,
    speculativeProbe,
  };
}

export function runnerArchivesSpeculativeProbeDisposition(
  input: AiDecisionInput,
): { admitted: boolean; bucket: number; opportunityKey: string } {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  const lastMutation = history
    .slice(lastArchivesAccessIndex + 1)
    .filter((event) => eventMayChangeArchives(event))
    .at(-1);
  const opportunityKey = [
    "archives-speculative-probe",
    input.seed,
    runnerHiddenArchivesCount(input),
    input.playerView.opponent.discardCount,
    lastMutation?.eventId ?? "initial-visible-state",
  ].join("|");
  const bucket = runnerPressureVariationBucket(opportunityKey, 8);
  return { admitted: bucket === 0, bucket, opportunityKey };
}

function unresolvedRandomCorpDiscard(input: AiDecisionInput): boolean {
  const history = mergedPublicHistory(input);
  const lastArchivesAccessIndex = findLastHistoryIndex(history, (event) =>
    isArchivesAccessEvent(event),
  );
  return history.slice(lastArchivesAccessIndex + 1).some((event) => {
    const payload = event.publicPayload;
    return (
      payload.actor === "corp" &&
      (payload.hiddenZoneAction === "hq_random_discard" ||
        payload.randomizedByCockroach === true ||
        (typeof payload.cardImplementationRandomHqDiscardCost === "number" &&
          payload.cardImplementationRandomHqDiscardCost > 0))
    );
  });
}
