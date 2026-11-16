import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";

import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import { compareAction } from "../runtime/action-order";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  exactCurrentChoiceAction,
  unresolvedChoiceFailure,
} from "../runtime/plan-bound-choice-contract";
import { type SimulationRng } from "./simulation-rng";

export function chooseRandomLegalDecision(
  input: AiDecisionInput,
  simulationRng: SimulationRng,
): AiDecision {
  const legalActions = input.legalActions.slice().sort(compareAction);
  if (legalActions.length === 0) {
    throw new PlanResolutionFailure("no_current_route_head", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: [],
      owner: "rules_contract",
      removalCondition:
        "Expose at least one current LegalAction for every non-terminal simulation decision window.",
    });
  }
  const stale = legalActions.find(
    (action): boolean => !actionMatchesCurrentDecision(input, action),
  );
  if (
    stale !== undefined ||
    new Set(legalActions.map((action) => action.actionId)).size !==
      legalActions.length
  )
    throw new PlanResolutionFailure("stale_or_future_action_reference", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: legalActions.map((action) => action.type),
      ...(stale ? { unresolvedActionIds: [stale.actionId] } : {}),
      owner: "rules_contract",
      removalCondition:
        "Draw the random action from a unique, current Engine offer.",
    });
  const index = simulationRng.nextInt(legalActions.length);
  const selected = legalActions[index];
  if (!selected) {
    throw new PlanResolutionFailure("executor_invariant_broken", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: legalActions.map((action) => action.type),
      owner: "scheduler",
      removalCondition:
        "Keep SimulationRng.nextInt within the requested LegalAction index range.",
      candidateCount: legalActions.length,
    });
  }
  const selectedChoices = randomSimulationChoice(
    input,
    selected,
    simulationRng,
  );
  return {
    actionId: selected.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "simulation.random_legal_bot",
    explanation:
      "Deterministisch pseudozufällige legale Aktion für den Benchmark.",
    consideredActionIds: legalActions.map((action) => action.actionId),
    fallbackUsed: false,
    timeoutUsed: false,
    confidence: 0.35,
    evidence: [`mode:random_legal_bot`, `rng_counter:${simulationRng.counter}`],
  };
}

function randomSimulationChoice(
  input: AiDecisionInput,
  action: LegalAction,
  rng: SimulationRng,
): AiDecision["selectedChoices"] {
  if (action.type !== "resolve_choice") return undefined;
  const choice = input.playerView.pendingChoice;
  if (!choice || exactCurrentChoiceAction(input, choice) !== action) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Bind the random-control choice to the current Engine offer.",
    );
  }
  const available = choice.options
    .filter((option) => option.selectable !== false)
    .map((option) => option.id)
    .sort();
  const maximum = Math.min(choice.maxSelections, available.length);
  if (
    !Number.isSafeInteger(choice.minSelections) ||
    !Number.isSafeInteger(choice.maxSelections) ||
    choice.minSelections < 0 ||
    choice.minSelections > maximum
  ) {
    throw unresolvedChoiceFailure(
      input,
      action,
      "Expose a legal selection count in the current Engine choice.",
    );
  }

  const range = maximum - choice.minSelections + 1;
  const count = choice.minSelections + (range > 1 ? rng.nextInt(range) : 0);
  const selectedOptionIds: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = available.length === 1 ? 0 : rng.nextInt(available.length);
    const [optionId] = available.splice(index, 1);
    if (optionId === undefined) {
      throw unresolvedChoiceFailure(
        input,
        action,
        "Keep the simulation choice draw within the selectable Engine options.",
      );
    }
    selectedOptionIds.push(optionId);
  }
  return { choiceId: choice.choiceId, selectedOptionIds };
}
