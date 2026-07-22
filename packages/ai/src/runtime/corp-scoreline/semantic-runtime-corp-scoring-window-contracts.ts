import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

export type CorpServerLike = {
  id: string;
  ice: readonly VisibleCard[];
  root: readonly VisibleCard[];
};

export type CorpScoringWindowKind =
  | "none"
  | "unsafe"
  | "temporary_safe"
  | "durable";

export type CorpScoringWindowHorizon =
  | "immediate"
  | "next_turn"
  | "slow"
  | "unknown";

export type CorpScoringWindowNextStep =
  | "score"
  | "advance"
  | "install_agenda"
  | "build_remote_ice"
  | "gain_credit"
  | "none";

export type CorpScoringWindowAgendaStealSeverity =
  | "none"
  | "normal"
  | "near_win"
  | "game_ending";

export type CorpScoringWindowAssessment = {
  serverId: string;
  windowKind: CorpScoringWindowKind;
  runnerCanContestNow: boolean;
  runnerCanReachAccessNow: boolean;
  agendaStealRelevantNow: boolean;
  runnerCanContestBeforeScore: boolean;
  runnerCanReachAccessBeforeScore: boolean;
  agendaStealRelevantBeforeScore: boolean;
  agendaPointsAtRisk?: number;
  runnerAgendaPointsAfterSteal?: number;
  agendaStealSeverity?: CorpScoringWindowAgendaStealSeverity;
  missingVisibleBreakerCoverage: boolean;
  corpCanRezRelevantIce: boolean;
  affordableDurableRelevantIceCount?: number;
  dynamicProtectionWeaknessCount?: number;
  dynamicProtectionReserve?: number;
  corpCanRezFullPathWithDynamicReserve?: boolean;
  scoreHorizon: CorpScoringWindowHorizon;
  runnerExposureCreditActions: number;
  recommendedNextStep: CorpScoringWindowNextStep;
  evidence: string[];
};

export function corpScoringWindowHasFundedPreScoreProtection(
  assessment:
    | Pick<
        CorpScoringWindowAssessment,
        | "runnerCanContestBeforeScore"
        | "runnerCanReachAccessBeforeScore"
        | "agendaStealRelevantBeforeScore"
        | "agendaStealSeverity"
        | "corpCanRezRelevantIce"
        | "corpCanRezFullPathWithDynamicReserve"
      >
    | undefined,
): boolean {
  return Boolean(
    assessment &&
    assessment.runnerCanContestBeforeScore === false &&
    assessment.runnerCanReachAccessBeforeScore === false &&
    assessment.agendaStealRelevantBeforeScore === false &&
    assessment.agendaStealSeverity !== "near_win" &&
    assessment.agendaStealSeverity !== "game_ending" &&
    assessment.corpCanRezRelevantIce === true &&
    assessment.corpCanRezFullPathWithDynamicReserve === true,
  );
}

export type SemanticRuntimeCorpScoringWindowDependencies<
  TServer extends CorpServerLike = CorpServerLike,
> = {
  actionServerId: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  server: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => TServer | undefined;
  actionCreditCost: (action: LegalAction) => number;
  actionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  advanceCompletesScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  remoteHasScoreLine: (server: TServer | undefined) => boolean;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
  visibleIceRezCost: (card: VisibleCard) => number | undefined;
  actionSourceCard?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => VisibleCard | undefined;
};
