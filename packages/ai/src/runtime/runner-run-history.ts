import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";

export type RunnerRecentStartRunsOnServerDependencies = {
  publicHistory: (input: AiDecisionInput) => readonly PublicGameEvent[];
  eventVersion: (event: PublicGameEvent) => number;
  serverIdFromEvent: (event: PublicGameEvent) => string | undefined;
};

export function runnerRecentStartRunsOnServer(
  input: AiDecisionInput,
  serverId: string,
  dependencies: RunnerRecentStartRunsOnServerDependencies,
): number {
  let count = 0;
  const history = dependencies.publicHistory(input);
  let seenRunnerActions = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (input.playerView.stateVersion - dependencies.eventVersion(event) > 18)
      break;
    if (runnerRunProgressEvent(actionType)) break;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (actor !== "runner" || actionType !== "start_run") continue;
    seenRunnerActions += 1;
    const target = dependencies.serverIdFromEvent(event);
    if (target === serverId) count += 1;
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

export function runnerRecentBasicCreditActions(
  input: AiDecisionInput,
  dependencies: Pick<
    RunnerRecentStartRunsOnServerDependencies,
    "publicHistory" | "eventVersion"
  >,
): number {
  const history = dependencies.publicHistory(input);
  let count = 0;
  let seenRunnerActions = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    if (input.playerView.stateVersion - dependencies.eventVersion(event) > 18)
      break;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (runnerRunProgressEvent(actionType)) break;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (actor !== "runner") continue;
    seenRunnerActions += 1;
    if (actionType === "gain_credit") count += 1;
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

export function runnerRunProgressEvent(actionType: string): boolean {
  return (
    actionType === "steal_agenda" ||
    actionType === "score_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "advance_card" ||
    actionType === "install_card"
  );
}
