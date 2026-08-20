import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";

import { compareAction } from "../runtime/action-order";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { type SimulationRng } from "./simulation-rng";

type RandomLegalDecisionDependencies = {
  readonly selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
};

export function chooseRandomLegalDecision(
  input: AiDecisionInput,
  simulationRng: SimulationRng,
  dependencies: RandomLegalDecisionDependencies,
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
  const selectedChoices = dependencies.selectedChoicesForDecision(
    input,
    selected,
  );
  return {
    actionId: selected.actionId,
    ...(selectedChoices ? { selectedChoices } : {}),
    reasonCode: "simulation.random_legal_bot",
    explanation:
      "Deterministisch pseudozufaellige legale Aktion fuer Benchmark.",
    consideredActionIds: legalActions.map((action) => action.actionId),
    fallbackUsed: false,
    timeoutUsed: false,
    confidence: 0.35,
    evidence: [`mode:random_legal_bot`, `rng_counter:${simulationRng.counter}`],
  };
}
