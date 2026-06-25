import {
  type AiDecision,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";

import { compareAction } from "../runtime/action-order";
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
  const fallback = legalActions[0];
  if (!fallback) {
    return {
      actionId: "",
      reasonCode: "simulation.random.no_legal_action",
      explanation: "Keine legale Aktion verfuegbar.",
      consideredActionIds: [],
      fallbackUsed: true,
      timeoutUsed: false,
      confidence: 0,
    };
  }
  const index = simulationRng.nextInt(legalActions.length);
  const selected = legalActions[index] ?? fallback;
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
