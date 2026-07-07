// Public compatibility surface for historical plan exports.
// Keep runtime and simulation access on legacy-entrypoints.ts.
export type {
  AiDeckStrategyDeckSnapshot,
} from "../deck-strategy-snapshot";
export {
  evaluateCorpOpeningHand,
  evaluateRunnerOpeningHand,
} from "../deck-opening-hand";
export type {
  CorpOpeningHandEvaluation,
  OpeningHandEvaluation,
  RunnerOpeningHandEvaluation,
} from "../deck-opening-hand";
export {
  assessCorpIcePortfolioAction,
  assessCorpScoreTerminalWindow,
  chooseCorpPlanAction,
  chooseCorpPlanDecision,
  classifyCorpScoredAgendaAbility,
  classifyScoredAgendaActionFromOntology,
  corpPlanUsesOnlyAiSupportedCards,
  evaluateAgendaRisk,
  evaluateCorpPlan,
  evaluateCorpScoringProgress,
  evaluateEconomyReserve,
  evaluateIceRez,
  evaluateRemoteIntentMemory,
  evaluateRemoteRezReserve,
  evaluateRemoteScoreHorizon,
  evaluateRunnerContestCapacity,
  evaluateScoringWindow,
  evaluateServerThreat,
  generateCorpPlanCandidates,
  hasCorpPlanAction,
} from "./corp-plans";
export type {
  CorpIcePortfolioActionAssessment,
  CorpPlanCandidate,
  CorpPlanDebug,
  CorpPlanDecision,
  CorpPlanEvaluatorResult,
  CorpPlanKind,
  CorpPlanScore,
  CorpPlanStep,
  RemoteScoreHorizon,
  RunnerContestCapacity,
} from "./corp-plans";
export {
  chooseRunnerPlanAction,
  chooseRunnerPlanDecision,
  estimateRunCost,
  evaluateCorpScoringThreat,
  evaluateRemoteThreat,
  evaluateRunnerEarlyTurnStrategy,
  evaluateRunnerPlan,
  evaluateRunnerRig,
  evaluateServerAccessValue,
  generateRunnerPlanCandidates,
  hasRunnerPlanAction,
  runnerPlanUsesOnlyAiSupportedCards,
} from "./runner-plans";
export type {
  RunnerPlanCandidate,
  RunnerPlanDebug,
  RunnerPlanDecision,
  RunnerPlanEvaluatorResult,
  RunnerPlanKind,
  RunnerPlanScore,
  RunnerPlanStep,
} from "./runner-plans";
