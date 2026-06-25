import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  centralPressureTargetsForCard,
  isCentralPressureCardForMetrics,
} from "./central-pressure-card";
import { isRemoteServerTarget } from "../runtime/server-target";

export type NoFreshCentralSubstitutionType =
  | "economy"
  | "rig_unlock"
  | "remote_contest"
  | "pressure_install"
  | "setup_search"
  | "end_turn";

type NoFreshCentralDependencies = {
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export function centralRunEventGoodForTarget(
  input: AiDecisionInput,
  target: "hq" | "rd" | "archives",
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined,
): boolean {
  return input.legalActions.some((action) => {
    if (action.side !== "runner" || action.type !== "play_event") return false;
    return centralPressureTargetsForCard(
      sourceDefinitionIdForAction(input, action),
    ).includes(target);
  });
}

export function noFreshCentralSubstitutionTypeForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: NoFreshCentralDependencies,
): NoFreshCentralSubstitutionType | undefined {
  if (dependencies.isRunnerEconomyAction(input, action)) return "economy";
  if (
    action.type === "start_run" &&
    typeof action.payload?.serverId === "string" &&
    isRemoteServerTarget(action.payload.serverId)
  )
    return "remote_contest";
  if (action.type === "install_card") {
    const definitionId = dependencies.sourceDefinitionIdForAction(
      input,
      action,
    );
    if (isCentralPressureCardForMetrics(definitionId, true))
      return "pressure_install";
    if (
      dependencies
        .rolesForAction(input, action)
        .some((role) => role.startsWith("breaker_"))
    )
      return "rig_unlock";
  }
  if (
    action.type === "draw_card" ||
    (action.type === "play_event" &&
      dependencies
        .rolesForAction(input, action)
        .some(
          (role) =>
            role === "draw" || role === "setup" || role.includes("search"),
        )) ||
    action.type === "resolve_choice"
  )
    return "setup_search";
  if (action.type === "end_turn") return "end_turn";
  return undefined;
}
