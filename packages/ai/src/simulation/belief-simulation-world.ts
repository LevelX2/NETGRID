import type { AiDecisionInput } from "@netgrid/shared";
import { reconstructBeliefState } from "../belief-state";
import { assertAiInputIsSideSafe } from "./side-safe-input";
import type { SimulationWorld } from "./simulation-types";

export function createBeliefSimulationWorld(
  input: AiDecisionInput,
  seed: string = `${input.seed}:belief:${input.actionNumber}`,
): SimulationWorld {
  const belief = reconstructBeliefState(input);
  const hypotheses = belief.entries
    .filter((entry) => entry.kind === "hypothesis")
    .map((entry) => entry.subject);
  return {
    worldId: `simworld:${input.side}:${belief.version}:${seed}`,
    sourceBeliefVersion: belief.version,
    seed,
    hiddenAssumptions: hypotheses.slice(0, 12),
    redactionSafe: assertAiInputIsSideSafe(input),
  };
}
