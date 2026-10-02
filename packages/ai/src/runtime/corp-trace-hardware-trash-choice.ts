import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { CorpGenericDefenseSignal } from "../plans/corp-defense-contracts";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import { corpTraceHardwareTrashChoiceFacts } from "../corp/defense/trace-hardware-trash-choice-facts";
import {
  unresolvedChoiceFailure,
  type PendingChoice,
  type PendingChoiceOptions,
} from "./plan-bound-choice-contract";

/** Completes the selected route's exact payload; never ranks or chooses targets. */
export function selectedCorpTraceHardwareTrashChoiceOptionIds(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  options: PendingChoiceOptions,
  portfolio: ResidentPlanPortfolio | undefined = residentPlanPortfolioSnapshot(
    input,
  ),
): string[] {
  const executor = portfolio?.instances.find(
    (instance) =>
      instance.instanceId === portfolio.executorInstanceId &&
      instance.moduleId === "corp.defend_servers" &&
      instance.executionState === "executor",
  );
  const state = executor?.moduleState as
    | { kind?: string; signals?: CorpGenericDefenseSignal[] }
    | undefined;
  const signals = state?.signals?.filter(
    (signal) =>
      signal.kind === "generic" &&
      signal.phase === "resolve_hardware_trash" &&
      signal.actionIds?.length === 1 &&
      signal.actionIds[0] === action.actionId,
  );
  const signal = signals?.length === 1 ? signals[0] : undefined;
  const resolution = signal?.choiceResolution;
  const facts = corpTraceHardwareTrashChoiceFacts(
    input,
    action,
    choice,
    options,
  );
  if (
    state?.kind !== "defense" ||
    portfolio?.stateVersion !== input.playerView.stateVersion ||
    resolution?.kind !== "trace_hardware_trash" ||
    resolution.sourceStateVersion !== input.playerView.stateVersion ||
    resolution.choiceId !== choice.choiceId ||
    resolution.choiceSource !== choice.source ||
    resolution.traceId !== facts.traceId ||
    resolution.runId !== facts.runId ||
    resolution.sourceIceInstanceId !== facts.sourceIceInstanceId ||
    resolution.sourceDefinitionId !== facts.sourceDefinitionId ||
    resolution.subroutineIndex !== facts.subroutineIndex ||
    signal?.serverId !== facts.serverId ||
    signal.sourceDefinitionIds.length !== 1 ||
    signal.sourceDefinitionIds[0] !== facts.sourceDefinitionId ||
    !facts.targets.some(
      (target) =>
        target.optionId === resolution.selectedOptionId &&
        target.card.instanceId === resolution.targetCardInstanceId,
    )
  )
    throw unresolvedChoiceFailure(
      input,
      action,
      "Preserve the selected corp.defend_servers executor and its exact hardware target, Trace origin, action and state binding.",
    );
  return [resolution.selectedOptionId];
}
