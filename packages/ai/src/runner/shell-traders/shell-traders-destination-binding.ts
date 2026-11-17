import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { selectableChoiceOptions } from "../../runtime/choice-option";
import { exactCurrentChoiceAction } from "../../runtime/plan-bound-choice-contract";

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
  const action = exactCurrentChoiceAction(input, choice);
  const options = selectableChoiceOptions(choice.options);
  const rig = input.playerView.own.rig ?? [];
  const exact =
    input.side === "runner" &&
    choice.kind === "select_option" &&
    version === String(choice.stateVersion) &&
    extra.length === 0 &&
    (reason === "paid" || reason === "start_turn") &&
    choice.sourceCardInstanceId === sourceId &&
    rig.some((card) => card.instanceId === sourceId && card.known) &&
    input.playerView.specialZones?.setAside.some(
      (card) => card.instanceId === targetId && card.known,
    ) &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    options.length > 0 &&
    options.every(
      (option) =>
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
  const selected = options.sort(
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
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "runner" ||
    !choice ||
    binding.stateVersion !== input.playerView.stateVersion ||
    binding.choiceId !== choice.choiceId ||
    binding.sourceCardInstanceId !== choice.sourceCardInstanceId ||
    !selectableChoiceOptions(choice.options).some(
      (option) => option.id === binding.selectedOptionId,
    )
  )
    return undefined;
  const action = exactCurrentChoiceAction(input, choice);
  return action?.actionId === binding.actionId ? action : undefined;
}
