import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  isRunnerEconomyRole,
  isRunnerNonAdditiveUtilityRole,
  isRunnerPressureRole,
} from "../runtime/runner-role-classification";

type RunnerInstallClassificationDependencies = {
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  rolesForCardId: (cardId: string | undefined) => string[];
};

type RunnerActionRoleDependencies = {
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function isRunnerEconomyActionForSimulation(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerActionRoleDependencies,
): boolean {
  if (action.side !== "runner") return false;
  if (action.type === "gain_credit") return true;
  if (
    action.type !== "play_event" &&
    action.type !== "install_card" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  )
    return false;
  return dependencies
    .rolesForAction(input, action)
    .some((role) => isRunnerEconomyRole(role));
}

export function isRunnerRigInstallActionForSimulation(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerActionRoleDependencies,
): boolean {
  if (action.type !== "install_card") return false;
  const roles = dependencies.rolesForAction(input, action);
  return roles.some(
    (role) =>
      role.startsWith("breaker_") ||
      role === "memory" ||
      role === "memory_support" ||
      role === "setup" ||
      role === "build_rig" ||
      isRunnerPressureRole(role),
  );
}

export function isRunnerPressureActionForSimulation(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerActionRoleDependencies,
): boolean {
  if (action.side !== "runner") return false;
  const roles = dependencies.rolesForAction(input, action);
  return (
    action.type === "start_run" ||
    roles.some((role) => isRunnerPressureRole(role))
  );
}

export function hasRunnerPlayableEconomyActionForSimulation(
  input: AiDecisionInput,
  excludeActionId: string | undefined,
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== excludeActionId &&
      action.side === "runner" &&
      isRunnerEconomyAction(input, action) &&
      action.source !== "basic_action" &&
      action.source !== "game_rule",
  );
}

export function hasRunnerInstallableBreakerActionForSimulation(
  input: AiDecisionInput,
  excludeActionId: string | undefined,
  dependencies: RunnerActionRoleDependencies,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== excludeActionId &&
      action.side === "runner" &&
      action.type === "install_card" &&
      dependencies
        .rolesForAction(input, action)
        .some((role) => role.startsWith("breaker_")),
  );
}

export function hasRunnerRunnablePressureActionForSimulation(
  input: AiDecisionInput,
  excludeActionId: string | undefined,
  isRunnerPressureAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean,
): boolean {
  return input.legalActions.some((action) => {
    if (action.actionId === excludeActionId || action.side !== "runner")
      return false;
    if (isRunnerPressureAction(input, action)) return true;
    if (action.type !== "start_run") return false;
    const serverId =
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : "";
    if (!serverId) return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (serverId.startsWith("remote_") && (server?.root.length ?? 0) === 0)
      return false;
    return input.playerView.own.credits >= 3 || (server?.ice.length ?? 0) === 0;
  });
}

export function isRunnerDuplicateInstallForSimulation(
  input: AiDecisionInput,
  action: LegalAction,
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined,
): boolean {
  const definitionId = sourceDefinitionIdForAction(input, action);
  if (!definitionId || action.type !== "install_card") return false;
  return (
    input.playerView.own.rig?.some(
      (card) => card.known && card.definitionId === definitionId,
    ) === true
  );
}

export function isRunnerLowValueDuplicateInstallForSimulation(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerInstallClassificationDependencies,
): boolean {
  const definitionId = dependencies.sourceDefinitionIdForAction(input, action);
  if (!definitionId) return false;
  const roles = dependencies.rolesForCardId(definitionId);
  if (definitionId === "onr_v1_165_junkyard-bbs") return true;
  if (roles.some((role) => role === "memory" || role === "memory_support"))
    return false;
  if (roles.some((role) => isRunnerPressureRole(role))) return false;
  if (roles.some((role) => isRunnerNonAdditiveUtilityRole(role))) return true;
  if (roles.some((role) => role.startsWith("breaker_"))) return true;
  return roles.some(
    (role) =>
      role === "resource" ||
      role === "setup" ||
      role === "draw" ||
      role === "tag_risk" ||
      isRunnerEconomyRole(role),
  );
}
