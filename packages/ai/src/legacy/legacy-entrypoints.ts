// Single internal entrypoint for runtime and simulation Legacy access.
// Keep new semantic behavior outside legacy and route remaining Legacy use here.
export {
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  chooseRunnerPlanAction,
  classifyCorpScoredAgendaAbility,
  hasCorpPlanAction,
  hasRunnerPlanAction,
} from "./legacy-planner-entrypoints";
export {
  chooseCorpLegacyBaselineAction,
  chooseRunnerLegacyBaselineAction,
  type LegacyBaselineChoice,
  type LegacyBaselineDependencies,
} from "./legacy-baseline";
export {
  scoreActionsForLegacy,
  type LegacyActionScorerDependencies,
} from "./legacy-action-scorer";
export {
  createLegacyActionScoringComposition,
  type LegacyActionScoringCompositionDependencies,
} from "./legacy-action-scoring-composition";
export {
  createLegacyDecisionContext,
  type LegacyDecisionContextDependencies,
} from "./legacy-decision-context";
export { semanticRuntimeForcedLegacy } from "./legacy-runtime-fallback";
