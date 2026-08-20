import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import type { RunnerTargetedIceTrashChoiceContinuation } from "./runner-targeted-ice-trash-plan";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOptions = PendingChoice["options"];

const TARGETED_ICE_TRASH_CHOICE_SOURCES = {
  rezzed: "card_implementation.pay_rez_cost_trash_rezzed_ice:",
  unrezzed: "card_implementation.trash_unrezzed_ice:",
} as const;

export function isRunnerTargetedIceTrashChoice(choice: PendingChoice): boolean {
  return targetedIceTrashChoiceSource(choice) !== undefined;
}

export function selectedRunnerTargetedIceTrashChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const source = targetedIceTrashChoiceSource(choice);
  const portfolio = residentPlanPortfolioSnapshot(input);
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.executionState === "executor" &&
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote"),
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        choiceContinuation?: RunnerTargetedIceTrashChoiceContinuation;
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const exactOrigin =
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    choice.side === "runner" &&
    choice.kind === "select_cards" &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    choice.stateVersion === input.playerView.stateVersion &&
    source?.choiceStateVersion === input.playerView.stateVersion &&
    portfolio !== undefined &&
    executor !== undefined &&
    executor.dedupeKey === continuation?.ownerDedupeKey &&
    continuation?.family === "runner_targeted_ice_trash" &&
    continuation.kind === "targeted_ice_trash" &&
    continuation.targetIceState === source?.targetIceState &&
    continuation.ownerModuleId === executor.moduleId &&
    continuation.sourceCardInstanceId === source?.sourceCardInstanceId &&
    continuation.sourceActionId === continuation.selectedActionId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    continuation.plannedAtStateVersion === portfolio.stateVersion &&
    continuation.selectedAtStateVersion + 1 === input.playerView.stateVersion &&
    (moduleState?.kind === "central_pressure" ||
      moduleState?.kind === "remote_contest");
  if (!exactOrigin) {
    throw targetedIceTrashChoiceFailure(
      input,
      action,
      "Bind the paid ICE-trash choice to the exact resident central/remote executor, selected source action, source card and planned target.",
      executor?.instanceId,
    );
  }
  const exactOptions = selectableOptions.filter((option) =>
    continuation.targetIceState === "rezzed"
      ? option.value === continuation.targetIceInstanceId
      : option.metadata?.targetServerId === continuation.serverId &&
        option.metadata?.targetIcePosition === continuation.targetIcePosition,
  );
  if (exactOptions.length !== 1) {
    throw targetedIceTrashChoiceFailure(
      input,
      action,
      "Expose exactly the preflighted side-safe ICE slot; no generic target heuristic or first-option fallback may replace it.",
      executor.instanceId,
    );
  }
  return exactOptions[0]!.id;
}

function targetedIceTrashChoiceSource(choice: PendingChoice):
  | {
      sourceCardInstanceId: string;
      choiceStateVersion: number;
      targetIceState: "rezzed" | "unrezzed";
    }
  | undefined {
  const sourceEntry = Object.entries(TARGETED_ICE_TRASH_CHOICE_SOURCES).find(
    ([, prefix]) => choice.source.startsWith(prefix),
  ) as ["rezzed" | "unrezzed", string] | undefined;
  if (!sourceEntry) return undefined;
  const [targetIceState, prefix] = sourceEntry;
  const suffix = choice.source.slice(prefix.length);
  const separator = suffix.lastIndexOf(":");
  if (separator <= 0) return undefined;
  const sourceCardInstanceId = suffix.slice(0, separator);
  const choiceStateVersion = Number(suffix.slice(separator + 1));
  if (
    sourceCardInstanceId.length === 0 ||
    !Number.isInteger(choiceStateVersion)
  ) {
    return undefined;
  }
  return { sourceCardInstanceId, choiceStateVersion, targetIceState };
}

function targetedIceTrashChoiceFailure(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
  planInstanceId?: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((legalAction) => legalAction.type),
    unresolvedActionIds: [action.actionId],
    owner: "continuation",
    removalCondition,
    ...(planInstanceId ? { planInstanceId } : {}),
  });
}
