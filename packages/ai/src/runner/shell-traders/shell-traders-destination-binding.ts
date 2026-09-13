import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

export type ShellTradersDestinationState = {
  kind: "shell_traders_destination";
  phase: "resolve_destination";
  actionId: string;
  choiceId: string;
  stateVersion: number;
  sourceCardInstanceId: string;
  targetCardInstanceId: string;
  selectedOptionId: string;
};

// The pipeline owner chooses the destination of an already committed install.
// Engine facts decide displacement; no host capacity rule is reconstructed here.
export function shellTradersDestinationBinding(
  input: AiDecisionInput,
): ShellTradersDestinationState | undefined {
  const choice = input.playerView.pendingChoice;
  if (!choice?.source.startsWith("runner.delayed_install_destination:"))
    return undefined;
  const [, sourceId, targetId, reason, version, ...extra] =
    choice.source.split(":");
  const action = input.legalActions.find(
    (entry) => entry.type === "resolve_choice",
  );
  const requirement = action?.choiceRequirements?.[0];
  const options = choice.options.filter(
    (option) => option.selectable !== false,
  );
  const rig = input.playerView.own.rig ?? [];
  const exact =
    input.side === "runner" &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.stateVersion === input.playerView.stateVersion &&
    Number(version) === choice.stateVersion &&
    extra.length === 0 &&
    (reason === "paid" || reason === "start_turn") &&
    choice.sourceCardInstanceId === sourceId &&
    rig.some((card) => card.instanceId === sourceId && card.known) &&
    input.playerView.specialZones?.setAside.some(
      (card) => card.instanceId === targetId && card.known,
    ) &&
    action?.side === "runner" &&
    action.expiresAtStateVersion === choice.stateVersion &&
    action.timingPoint === input.playerView.timingPoint &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    requirement.optionIds.length === options.length &&
    options.length > 0 &&
    options.every(
      (option) =>
        requirement.optionIds.includes(option.id) &&
        typeof option.metadata?.delayedInstallRequiresProgramTrash ===
          "boolean" &&
        (option.id === "rig"
          ? option.value === "rig"
          : option.id === `host_${option.value}` &&
            rig.some((card) => card.instanceId === option.value && card.known)),
    );
  if (!exact || !action || !sourceId || !targetId) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      owner: "plan_module",
      removalCondition:
        "Bind the Shell Traders destination to its current source, prepared target, exact choice/action and complete Engine displacement facts.",
    });
  }
  const selected = options
    .slice()
    .sort(
      (a, b) =>
        Number(a.metadata!.delayedInstallRequiresProgramTrash) -
          Number(b.metadata!.delayedInstallRequiresProgramTrash) ||
        Number(b.id === "rig") - Number(a.id === "rig") ||
        a.id.localeCompare(b.id),
    )[0]!;
  return {
    kind: "shell_traders_destination",
    phase: "resolve_destination",
    actionId: action.actionId,
    choiceId: choice.choiceId,
    stateVersion: choice.stateVersion,
    sourceCardInstanceId: sourceId,
    targetCardInstanceId: targetId,
    selectedOptionId: selected.id,
  };
}

export function exactShellTradersDestinationAction(
  input: AiDecisionInput,
  binding: ShellTradersDestinationState,
): LegalAction | undefined {
  if (
    binding.stateVersion !== input.playerView.stateVersion ||
    binding.choiceId !== input.playerView.pendingChoice?.choiceId
  )
    return undefined;
  return input.legalActions.find(
    (action) =>
      action.actionId === binding.actionId &&
      action.type === "resolve_choice" &&
      action.expiresAtStateVersion === binding.stateVersion,
  );
}
