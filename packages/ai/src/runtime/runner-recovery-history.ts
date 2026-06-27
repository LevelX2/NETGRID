import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
  VisibleCard,
} from "@netgrid/shared";

const RECOVERY_TEXT_PATTERN = /recovery|trash_recovery|junkyard|heap|trash|bbs/;

export type RunnerRecoveryActionPatternDependencies = {
  sourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
  rolesForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => readonly string[];
};

export function runnerActionLooksLikeRecovery(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRecoveryActionPatternDependencies,
): boolean {
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  const source = dependencies.sourceCard(input, action);
  const roles = dependencies.rolesForAction(input, action);
  const text = [
    source?.title,
    source?.definitionId,
    source?.rulesText,
    ...roles,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("en-US");
  return RECOVERY_TEXT_PATTERN.test(text);
}

export type RunnerRecentRecoveryActionsDependencies = {
  publicHistory: (input: AiDecisionInput) => PublicGameEvent[];
  eventVersion: (event: PublicGameEvent) => number;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function runnerRecentRecoveryActions(
  input: AiDecisionInput,
  action: LegalAction | undefined,
  dependencies: RunnerRecentRecoveryActionsDependencies,
): number {
  const currentSource = action
    ? dependencies.sourceDefinitionIdForAction(input, action)
    : undefined;
  const history = dependencies.publicHistory(input);
  let count = 0;
  let seenRunnerActions = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    if (input.playerView.stateVersion - dependencies.eventVersion(event) > 18) {
      break;
    }
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (runnerRecoveryProgressEvent(actionType)) break;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (actor !== "runner") continue;
    seenRunnerActions += 1;
    if (publicEventLooksLikeRecovery(event, currentSource)) {
      count += 1;
    }
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

function runnerRecoveryProgressEvent(actionType: string): boolean {
  return (
    actionType === "steal_agenda" ||
    actionType === "score_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "install_card" ||
    actionType === "start_run"
  );
}

function publicEventLooksLikeRecovery(
  event: PublicGameEvent,
  currentSource: string | undefined,
): boolean {
  const payload = event.publicPayload;
  const source = [
    payload.sourceDefinitionId,
    payload.sourceCardDefinitionId,
    payload.cardDefinitionId,
    payload.definitionId,
  ].find((value): value is string => typeof value === "string");
  if (source && currentSource && source === currentSource) return true;
  const text = Object.values(payload)
    .filter(
      (value): value is string | number | boolean =>
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean",
    )
    .join(" ")
    .toLocaleLowerCase("en-US");
  return RECOVERY_TEXT_PATTERN.test(text);
}
