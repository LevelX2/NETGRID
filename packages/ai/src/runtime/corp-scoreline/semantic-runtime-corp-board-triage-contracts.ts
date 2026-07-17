import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { CorpScoringWindowAssessment } from "../semantic-runtime-corp-scoring-window";

export type CorpBoardTriagePrimary =
  | "score_now"
  | "force_scoreline_clock"
  | "protect_score_remote"
  | "fund_score_remote"
  | "protect_hq"
  | "protect_rd"
  | "recover_economy"
  | "setup_score_remote"
  | "low_value";

export type CorpBoardTriageSeverity = "low" | "medium" | "high" | "critical";

export type CorpBoardTriage = {
  primary: CorpBoardTriagePrimary;
  severity: CorpBoardTriageSeverity;
  targetServerId?: string | undefined;
  scoreRemoteServerId?: string | undefined;
  requiredRezFloor?: number | undefined;
  currentCredits?: number | undefined;
  runnerAgendaPointsAfterSteal?: number | undefined;
  evidence: string[];
};

export type RezFloorAssessment = {
  blockedByFloor: boolean;
  rezFloor?: number | undefined;
  requiredCreditsAfterAction?: number | undefined;
  creditsAfterAction?: number | undefined;
  evidence: string[];
};

export type SafetyGate = {
  allowed: boolean;
  evidence: string[];
};

export type CorpBoardTriageDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SafetyGate;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpAdvanceCompletesScore?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpScoringWindowAssessment?:
    | ((
        input: AiDecisionInput,
        action: LegalAction,
        roles?: string[],
      ) => CorpScoringWindowAssessment | undefined)
    | undefined;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RezFloorAssessment | undefined;
  corpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RezFloorAssessment | undefined;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpTaggedRunnerPayoffPressure?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export type ScoredLegalAction = {
  action: LegalAction;
  roles: string[];
  serverId?: string | undefined;
  scoringWindow?: CorpScoringWindowAssessment | undefined;
  remoteRezFloor?: RezFloorAssessment | undefined;
  centralRezFloor?: RezFloorAssessment | undefined;
};

export type ForcedScorelineClockPressure = {
  severity: CorpBoardTriageSeverity;
  targetServerId?: string | undefined;
  scoreRemoteServerId?: string | undefined;
  requiredRezFloor?: number | undefined;
  hqAgendaCount: number;
  hqAgendaPoints: number;
  rdCount?: number | undefined;
  evidence: string[];
};
