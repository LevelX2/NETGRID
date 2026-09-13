import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { CorpGenericDefenseSignal } from "../plans/corp-defense-contracts";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../plans/resident-plan-portfolio-memory";
import {
  unresolvedChoiceFailure,
  type PendingChoice,
  type PendingChoiceOptions,
} from "./plan-bound-choice-contract";

export function selectedCorpProgramTrashChoiceOptionIds(
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
  const signal = state?.signals?.find(
    (s) =>
      s.phase === "resolve_program_trash" &&
      s.actionIds?.length === 1 &&
      s.actionIds[0] === action.actionId,
  );
  const resolution = signal?.choiceResolution;
  const requirement = action.choiceRequirements?.[0];
  if (
    input.side !== "corp" ||
    state?.kind !== "defense" ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.visibility !== "public" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    resolution?.kind !== "program_trash" ||
    resolution.sourceStateVersion !== input.playerView.stateVersion ||
    choice.stateVersion !== input.playerView.stateVersion ||
    resolution.choiceId !== choice.choiceId ||
    resolution.choiceSource !== choice.source ||
    resolution.runId !== input.playerView.run?.runId ||
    resolution.sourceIceInstanceId !==
      input.playerView.run?.encounteredIce?.instanceId ||
    action.side !== "corp" ||
    action.type !== "resolve_choice" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== 1 ||
    requirement.maxSelections !== 1 ||
    requirement.optionIds.length !== options.length ||
    !options.every((o) => requirement.optionIds.includes(o.id)) ||
    !options.some(
      (o) =>
        o.id === resolution.selectedOptionId &&
        o.value === resolution.targetCardInstanceId,
    )
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind program trash to the current corp.defend_servers executor, exact run, choice, target and state version.",
    );
  }
  return [resolution.selectedOptionId];
}
