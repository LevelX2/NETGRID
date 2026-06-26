import type {
  AiDecision,
  AiDecisionInput,
  LegalAction,
  Side,
} from "@netgrid/shared";

import type { AiSimulationConfig } from "./ai-simulation-config";
import { chooseRandomLegalDecision } from "./random-legal-decision";
import { controllerModeForSide } from "./simulation-config-helpers";
import type { SimulationControllerMode } from "./simulation-types";
import type { SimulationRng } from "./simulation-rng";

export type SimulationDecisionContextDependencies = {
  chooseAiAction: (
    input: AiDecisionInput,
    options?: AiSimulationConfig["aiDecisionRuntimeOptions"],
  ) => AiDecision;
  chooseRunnerAction: (
    input: AiDecisionInput,
    options?: AiSimulationConfig["aiDecisionRuntimeOptions"],
  ) => AiDecision;
  chooseCorpAction: (
    input: AiDecisionInput,
    options?: AiSimulationConfig["aiDecisionRuntimeOptions"],
  ) => AiDecision;
  chooseRunnerBaselineAction: (input: AiDecisionInput) => AiDecision;
  chooseCorpBaselineAction: (input: AiDecisionInput) => AiDecision;
  selectedChoicesForDecision: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecision["selectedChoices"] | undefined;
};

export function createSimulationDecisionContext(
  dependencies: SimulationDecisionContextDependencies,
): {
  chooseDecisionForSimulation: (
    side: Side,
    input: AiDecisionInput,
    config: AiSimulationConfig,
    simulationRng: SimulationRng,
  ) => AiDecision;
  simulationSideUsesSemanticRuntime: (
    side: Side,
    config: AiSimulationConfig,
  ) => boolean;
} {
  function chooseDecisionForSimulation(
    side: Side,
    input: AiDecisionInput,
    config: AiSimulationConfig,
    simulationRng: SimulationRng,
  ): AiDecision {
    const mode = controllerModeForSide(side, config);
    switch (mode) {
      case "random_legal_bot":
        return chooseRandomLegalDecision(input, simulationRng, {
          selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
        });
      case "basic_runner_ai":
        return side === "runner"
          ? dependencies.chooseRunnerBaselineAction(input)
          : dependencies.chooseCorpBaselineAction(input);
      case "basic_corp_ai":
        return side === "corp"
          ? dependencies.chooseCorpBaselineAction(input)
          : dependencies.chooseRunnerBaselineAction(input);
      case "plan_corp_v1_4_0":
        return side === "corp"
          ? dependencies.chooseCorpAction(input, config.aiDecisionRuntimeOptions)
          : dependencies.chooseRunnerBaselineAction(input);
      case "plan_runner_v1_4_1":
        return side === "runner"
          ? dependencies.chooseRunnerAction(
              input,
              config.aiDecisionRuntimeOptions,
            )
          : dependencies.chooseCorpBaselineAction(input);
      case "belief_ai_v1_4_2":
        return dependencies.chooseAiAction(input, config.aiDecisionRuntimeOptions);
      case "current_candidate":
        return dependencies.chooseAiAction(input, config.aiDecisionRuntimeOptions);
    }
  }

  function simulationSideUsesSemanticRuntime(
    side: Side,
    config: AiSimulationConfig,
  ): boolean {
    return simulationModeUsesSemanticRuntime(controllerModeForSide(side, config));
  }

  return {
    chooseDecisionForSimulation,
    simulationSideUsesSemanticRuntime,
  };
}

function simulationModeUsesSemanticRuntime(
  mode: SimulationControllerMode,
): boolean {
  return mode === "belief_ai_v1_4_2" || mode === "current_candidate";
}
