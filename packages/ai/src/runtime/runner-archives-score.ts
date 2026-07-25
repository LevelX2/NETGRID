import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  findLastHistoryIndex,
  isArchivesAccessEvent,
  mergedPublicHistory,
} from "./public-event-history";

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
    const pressure = hiddenArchivesPressureContext(input);
    const randomDiscard = unresolvedRandomCorpDiscard(input);
    return [
      {
        key: "runner_archives_hidden_information",
        label: "Archives enthält verdeckte Information",
        value: 700,
        reason: [
          `hidden_archives:${hiddenArchivesCount}`,
          `corp_deck_count:${input.playerView.opponent.deckCount}`,
          `runner_agenda_points:${input.playerView.own.agendaPoints}`,
          `archives_corp_deck_pressure:${pressure.corpDeckPressure}`,
          `archives_runner_match_pressure:${pressure.runnerMatchPressure}`,
          `archives_random_discard_unseen:${randomDiscard}`,
          "archives_hidden_information_window:true",
        ].join("|"),
      },
    ];
  }
  return [];
}

export function runnerArchivesHasQualifiedHiddenPayoff(
  input: AiDecisionInput,
): boolean {
  return runnerHiddenArchivesCount(input) > 0;
}

function runnerHiddenArchivesCount(input: AiDecisionInput): number {
  const knownRootCount =
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.filter(
        (card) => card.known && typeof card.definitionId === "string",
      ).length ?? 0;
  return Math.max(
    0,
    input.playerView.opponent.discardCount - knownRootCount,
  );
}

function hiddenArchivesPressureContext(input: AiDecisionInput): {
  active: boolean;
  corpDeckPressure: boolean;
  runnerMatchPressure: boolean;
} {
  const corpDeckPressure = input.playerView.opponent.deckCount <= 6;
  const runnerMatchPressure =
    input.playerView.own.agendaPoints >=
    Math.max(1, input.playerView.agendaPointsToWin - 2);
  return {
    active: corpDeckPressure,
    corpDeckPressure,
    runnerMatchPressure,
  };
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
