import { aiLiveRuntimeDependencies } from "./ai-runtime-public-entrypoints";
import { createAiProductSimulationComposition } from "./simulation/ai-product-simulation-composition";

export type { AiSimulationConfig } from "./simulation/ai-simulation-config";
export type {
  AiSimulationSummary,
  AiSimulationTerminationKind,
} from "./simulation/ai-simulation-summary";
export { assertAiInputIsSideSafe } from "./simulation/side-safe-input";

export const { simulateAiGame } = createAiProductSimulationComposition(
  aiLiveRuntimeDependencies,
);
