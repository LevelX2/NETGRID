import type { AiDecisionInput } from "@netgrid/shared";

import {
  RUNNER_DAMAGE_PREVENTION_CONTEXT_IDS,
  RUNNER_FLATLINE_PREVENTION_CONTEXT_IDS,
  RUNNER_TRACE_DEFENSE_CONTEXT_IDS,
} from "./tag-punish-card-sets";

export type RunnerSurvivalCounterContext = {
  any: boolean;
  trace: boolean;
  damage: boolean;
  flatline: boolean;
  link: boolean;
};

export function runnerSurvivalCounterContextForInput(
  input: AiDecisionInput,
): RunnerSurvivalCounterContext {
  const visibleRunnerCards = input.playerView.opponent.rig ?? [];
  const definitionIds = new Set(
    visibleRunnerCards
      .filter((card) => card.known)
      .map((card) => card.definitionId)
      .filter((definitionId): definitionId is string => Boolean(definitionId)),
  );
  const trace = [...definitionIds].some((definitionId) =>
    RUNNER_TRACE_DEFENSE_CONTEXT_IDS.has(definitionId),
  );
  const damage = [...definitionIds].some((definitionId) =>
    RUNNER_DAMAGE_PREVENTION_CONTEXT_IDS.has(definitionId),
  );
  const flatline = [...definitionIds].some((definitionId) =>
    RUNNER_FLATLINE_PREVENTION_CONTEXT_IDS.has(definitionId),
  );
  return {
    any: trace || damage || flatline,
    trace,
    damage,
    flatline,
    link: trace,
  };
}
