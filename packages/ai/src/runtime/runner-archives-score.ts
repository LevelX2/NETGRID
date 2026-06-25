import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerArchivesServer = AiDecisionInput["playerView"]["servers"][number];

type RunnerArchivesEvaluation = {
  accessServerId: string;
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
  if (dependencies.evaluationForAction(input, action)?.accessServerId !== "archives")
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
    return [
      {
        key: "runner_archives_hidden_cards",
        label: "Archives verdeckte Karten",
        value: 700,
        reason: `hidden_archives:${hiddenArchivesCount}`,
      },
    ];
  }
  return [];
}
