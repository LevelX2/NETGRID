import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import {
  SOCIAL_ENGINEERING_DEFINITION_ID,
  type RunnerTargetedBypassChoiceContinuation,
} from "./runner-targeted-bypass-plan";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOptions = PendingChoice["options"];

const TARGETED_BYPASS_HIDE_CHOICE_SOURCE =
  "hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:";
const TARGETED_BYPASS_TARGET_CHOICE_SOURCE =
  "hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:";

export function isRunnerTargetedBypassHideChoice(
  choice: PendingChoice,
): boolean {
  return choice.source.startsWith(TARGETED_BYPASS_HIDE_CHOICE_SOURCE);
}

export function isRunnerTargetedBypassChoice(
  choice: PendingChoice,
): boolean {
  return choice.source.startsWith(TARGETED_BYPASS_TARGET_CHOICE_SOURCE);
}

export function selectedRunnerTargetedBypassHideChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const { continuation, executor } = targetedBypassContinuation({
    input,
    action,
    choice,
    sourcePrefix: TARGETED_BYPASS_HIDE_CHOICE_SOURCE,
    expectedChoiceKind: "bid_amount",
    stateVersionOffset: 1,
  });
  const exactOptions = selectableOptions.filter(
    (option) =>
      typeof option.value === "number" &&
      option.value === continuation.intendedHiddenAmount,
  );
  if (exactOptions.length !== 1) {
    throw targetedBypassChoiceFailure(
      input,
      action,
      "Expose exactly the preflighted Social Engineering hidden-credit amount; no generic bid or first-option fallback may replace it.",
      executor.instanceId,
    );
  }
  return exactOptions[0]!.id;
}

export function selectedRunnerTargetedBypassChoiceOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
): string {
  const { continuation, executor } = targetedBypassContinuation({
    input,
    action,
    choice,
    sourcePrefix: TARGETED_BYPASS_TARGET_CHOICE_SOURCE,
    expectedChoiceKind: "select_cards",
    stateVersionOffset: 3,
  });
  const serverOptions = selectableOptions.filter((option) => {
    const value = targetedBypassOptionValue(option.value);
    return value?.serverId === continuation.serverId;
  });
  const positionalOption = serverOptions[continuation.icePosition];
  const positionalValue = targetedBypassOptionValue(positionalOption?.value);
  const exactOption =
    positionalOption &&
    positionalValue?.serverId === continuation.serverId &&
    typeof continuation.visibleIceInstanceId === "string" &&
    continuation.visibleIceInstanceId.length > 0 &&
    positionalValue.iceInstanceId === continuation.visibleIceInstanceId
      ? positionalOption
      : undefined;
  if (!exactOption) {
    throw targetedBypassChoiceFailure(
      input,
      action,
      "Expose exactly the preflighted server and ICE-position option; a known visible ICE must retain its exact visible instance binding.",
      executor.instanceId,
    );
  }
  return exactOption.id;
}

function targetedBypassContinuation(params: {
  input: AiDecisionInput;
  action: LegalAction;
  choice: PendingChoice;
  sourcePrefix: string;
  expectedChoiceKind: PendingChoice["kind"];
  stateVersionOffset: number;
}): {
  continuation: RunnerTargetedBypassChoiceContinuation;
  executor: NonNullable<
    ReturnType<typeof residentPlanPortfolioSnapshot>
  >["instances"][number];
} {
  const { input, action, choice } = params;
  const source = targetedBypassChoiceSource(choice, params.sourcePrefix);
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
        choiceContinuation?: RunnerTargetedBypassChoiceContinuation;
      }
    | undefined;
  const continuation = moduleState?.choiceContinuation;
  const exactOrigin =
    input.side === "runner" &&
    action.side === "runner" &&
    action.type === "resolve_choice" &&
    choice.side === "runner" &&
    choice.kind === params.expectedChoiceKind &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    choice.stateVersion === input.playerView.stateVersion &&
    source?.choiceStateVersion === input.playerView.stateVersion &&
    portfolio !== undefined &&
    executor !== undefined &&
    executor.dedupeKey === continuation?.ownerDedupeKey &&
    continuation?.family === "runner_targeted_bypass" &&
    continuation.kind === "targeted_bypass_run" &&
    continuation.sourceDefinitionId ===
      SOCIAL_ENGINEERING_DEFINITION_ID &&
    continuation.ownerModuleId === executor.moduleId &&
    continuation.sourceCardInstanceId === source?.sourceCardInstanceId &&
    continuation.sourceActionId === continuation.selectedActionId &&
    continuation.selectedAtStateVersion === portfolio.stateVersion &&
    continuation.plannedAtStateVersion === portfolio.stateVersion &&
    continuation.selectedAtStateVersion + params.stateVersionOffset ===
      input.playerView.stateVersion &&
    (moduleState?.kind === "central_pressure" ||
      moduleState?.kind === "remote_contest");
  if (!exactOrigin) {
    throw targetedBypassChoiceFailure(
      input,
      action,
      "Bind each targeted-bypass choice to the exact resident central/remote executor, selected Social Engineering action, source card and planned continuation offset.",
      executor?.instanceId,
    );
  }
  return { continuation, executor };
}

function targetedBypassChoiceSource(
  choice: PendingChoice,
  sourcePrefix: string,
):
  | {
      sourceCardInstanceId: string;
      choiceStateVersion: number;
    }
  | undefined {
  if (!choice.source.startsWith(sourcePrefix)) return undefined;
  const suffix = choice.source.slice(sourcePrefix.length);
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
  return { sourceCardInstanceId, choiceStateVersion };
}

function targetedBypassOptionValue(
  value: PendingChoiceOptions[number]["value"] | undefined,
): { serverId: string; iceInstanceId: string } | undefined {
  if (typeof value !== "string") return undefined;
  const separator = value.indexOf("|");
  if (separator <= 0 || separator === value.length - 1) return undefined;
  const serverId = value.slice(0, separator);
  const iceInstanceId = value.slice(separator + 1);
  if (!serverId || !iceInstanceId || iceInstanceId.includes("|")) {
    return undefined;
  }
  return { serverId, iceInstanceId };
}

function targetedBypassChoiceFailure(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
  planInstanceId?: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map(
      (legalAction) => legalAction.type,
    ),
    unresolvedActionIds: [action.actionId],
    owner: "continuation",
    removalCondition,
    ...(planInstanceId ? { planInstanceId } : {}),
  });
}
