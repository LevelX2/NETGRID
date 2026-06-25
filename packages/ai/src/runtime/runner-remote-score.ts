import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
} from "@netgrid/shared";

type RunnerRemoteServer = AiDecisionInput["playerView"]["servers"][number];

type RunnerRemoteCandidateMemory = {
  exhaustive: boolean;
  agendaCandidateCount: number;
  relevantTrashCandidateCount: number;
  candidateCount: number;
};

export type RunnerRemoteScoreDependencies = {
  definitionType: (definitionId: string) => string | undefined;
  rootTrashCost: (card: RunnerRemoteServer["root"][number]) => number | undefined;
  candidateMemory: (
    input: AiDecisionInput,
    server: RunnerRemoteServer | undefined,
  ) => RunnerRemoteCandidateMemory | undefined;
};

export function runnerRemoteScoreComponents(
  input: AiDecisionInput,
  server: RunnerRemoteServer | undefined,
  dependencies: RunnerRemoteScoreDependencies,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const root = server?.root ?? [];
  const knownAgenda = root.some((card) => card.known && card.type === "agenda");
  const advancedRoot = root.some((card) => (card.advancementCounters ?? 0) > 0);
  const unknownRootCount = root.filter((card) => !card.known).length;
  const relevantTrash = root.some((card) => {
    if (!card.known) return false;
    const type = card.definitionId
      ? dependencies.definitionType(card.definitionId)
      : card.type;
    const trashCost = dependencies.rootTrashCost(card);
    return (
      (type === "asset" || type === "upgrade") &&
      trashCost !== undefined &&
      input.playerView.own.credits >= trashCost + 1
    );
  });
  const knownLowValueRoot =
    root.length > 0 &&
    unknownRootCount === 0 &&
    !knownAgenda &&
    !relevantTrash &&
    !advancedRoot;
  let value = 0;
  let reason = "remote_empty";
  if (knownAgenda) {
    value = 1500;
    reason = "known_remote_agenda";
  } else if (advancedRoot) {
    value = 1250;
    reason = "advanced_remote_root";
  } else if (relevantTrash) {
    value = 900;
    reason = "known_trashable_remote";
  } else if (unknownRootCount > 0) {
    value = 1050;
    reason = `unknown_remote_root:${unknownRootCount}`;
  } else if (root.length > 0) {
    value = 450;
    reason = knownLowValueRoot
      ? "known_low_value_remote_root"
      : "known_remote_root";
  }
  if (value !== 0) {
    components.push({
      key: "runner_remote_root_threat",
      label: "Remote-Root-Threat",
      value,
      reason,
    });
  }
  const candidateMemory = dependencies.candidateMemory(input, server);
  if (candidateMemory) {
    if (
      candidateMemory.exhaustive &&
      candidateMemory.agendaCandidateCount === 0 &&
      candidateMemory.relevantTrashCandidateCount === 0
    ) {
      components.push({
        key: "runner_remote_known_candidates_low_value",
        label: "Remote-Kandidaten niedrig",
        value: -650,
        reason: `candidates:${candidateMemory.candidateCount}`,
      });
    } else if (candidateMemory.agendaCandidateCount > 0) {
      components.push({
        key: "runner_remote_agenda_candidate",
        label: "Remote-Agenda-Kandidat",
        value: 350,
        reason: `agenda_candidates:${candidateMemory.agendaCandidateCount}`,
      });
    } else if (candidateMemory.relevantTrashCandidateCount > 0) {
      components.push({
        key: "runner_remote_trash_candidate",
        label: "Remote-Trash-Kandidat",
        value: 220,
        reason: `trash_candidates:${candidateMemory.relevantTrashCandidateCount}`,
      });
    }
  }
  if (root.length === 0 && (server?.ice.length ?? 0) > 0) {
    components.push({
      key: "runner_remote_empty_with_ice",
      label: "Leere Remote mit ICE",
      value: -800,
      reason: server?.id ?? "remote",
    });
  }
  return components;
}
