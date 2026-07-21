import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";
import type { CorpScorelineWindowAssessment } from "./semantic-runtime-corp-scoreline-assessment";

export type SemanticRuntimeCorpSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpRezFloorAssessment = {
  blockedByFloor: boolean;
  evidence: string[];
};

export type SemanticRuntimeCorpAdvancementPlacementAssessment = {
  dominatedByBasicAdvance: boolean;
  noConcreteConversion: boolean;
  scoreValue: number;
  evidence: string[];
};

export type SemanticRuntimeCorpContestabilityAssessment = {
  contestable: boolean;
  evidence: string[];
};

export type CorpBurstEconomyOperation = {
  actionKind: "operation" | "activated_ability";
  cost: number;
  gain: number;
  drawCards: number;
  netGain: number;
  actionValue: number;
  evidence: string[];
};

export const CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR = 50;
export const CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE = 1500;

export type SemanticRuntimeCorpScoreDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpSafetyGate;
  corpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpRemoteScoreContestabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpContestabilityAssessment | undefined;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpAdvanceCompletesScore?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => number;
  corpScoringWindowAssessment?:
    | ((
        input: AiDecisionInput,
        action: LegalAction,
        roles?: string[],
      ) => CorpScoringWindowAssessment | undefined)
    | undefined;
  corpScorelineWindowAssessment?:
    | ((input: AiDecisionInput) => CorpScorelineWindowAssessment)
    | undefined;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpAdvancementPlacementAssessment | undefined;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpTaggedRunnerPayoffPressure: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpTaggedPayoffWindowPassiveActionPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpPassiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};
