import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import {
  type PendingChoice,
  type PendingChoiceOptions,
  unresolvedChoiceFailure,
} from "../../runtime/plan-bound-choice-contract";
import { currentDelayedSuccessChoice } from "./temporary-ice-choice";

export function selectedCorpDelayedSuccessOptionId(
  input: AiDecisionInput,
  action: LegalAction,
  choice: PendingChoice,
  selectableOptions: PendingChoiceOptions,
  currentPortfolio?: ResidentPlanPortfolio,
): string[] {
  const portfolio = currentPortfolio ?? residentPlanPortfolioSnapshot(input);
  const current = currentDelayedSuccessChoice(input, action, choice);
  const boundDefensePlans = (portfolio?.instances ?? []).filter((instance) => {
    if (instance.moduleId !== "corp.defend_servers") return false;
    const state = instance.moduleState as
      | {
          kind?: unknown;
          delayedSuccessChoiceBinding?: {
            choiceId?: unknown;
            actionId?: unknown;
            sourceCardInstanceId?: unknown;
            serverId?: unknown;
            observedAtStateVersion?: unknown;
          };
        }
      | undefined;
    const candidateBinding = state?.delayedSuccessChoiceBinding;
    return (
      state?.kind === "defense" &&
      candidateBinding?.choiceId === choice.choiceId &&
      candidateBinding.actionId === action.actionId &&
      candidateBinding.sourceCardInstanceId === current?.sourceCardId &&
      candidateBinding.serverId === current?.serverId &&
      candidateBinding.observedAtStateVersion === input.playerView.stateVersion
    );
  });
  const executor =
    boundDefensePlans.length === 1 ? boundDefensePlans[0] : undefined;
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        delayedSuccessChoiceBinding?: {
          choiceId?: unknown;
          actionId?: unknown;
          selectedOptionId?: unknown;
          sourceCardInstanceId?: unknown;
          serverId?: unknown;
          observedAtStateVersion?: unknown;
        };
      }
    | undefined;
  const binding = moduleState?.delayedSuccessChoiceBinding;
  const selectedOption = selectableOptions.find(
    (option) =>
      option.id === binding?.selectedOptionId &&
      current?.options.some(
        (available) =>
          available.id === option.id && available.value === option.value,
      ),
  );
  const exactBinding =
    portfolio?.side === "corp" &&
    executor !== undefined &&
    moduleState?.kind === "defense" &&
    binding?.choiceId === choice.choiceId &&
    binding.actionId === action.actionId &&
    binding.selectedOptionId === selectedOption?.id &&
    binding.sourceCardInstanceId === current?.sourceCardId &&
    binding.serverId === current?.serverId &&
    binding.observedAtStateVersion === input.playerView.stateVersion &&
    current !== undefined &&
    selectedOption !== undefined &&
    typeof selectedOption.value === "string" &&
    ((selectedOption.id === "decline" && selectedOption.value === "decline") ||
      (selectedOption.id === `ice_${selectedOption.value}` &&
        input.playerView.own.gripOrHq.some(
          (card) =>
            card.instanceId === selectedOption.value &&
            card.known &&
            card.type === "ice",
        )));
  if (!exactBinding || !selectedOption) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Complete Dr. Dreff only from the exact current corp.defend_servers choice binding on the attacked fort and its legal decline or visible HQ-ICE payload.",
    );
  }
  return [selectedOption.id];
}
