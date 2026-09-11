import { type CorpFundedRemoteAccessRiskNeed } from "../runtime/corp-funded-score-protection";
import type { CorpOpeningRushDecision } from "../runtime/corp-opening-rush";

export type CorpScorePhase =
  | "select_agenda"
  | "unlock_remote_creation"
  | "install_counter_bank"
  | "advance_counter_bank"
  | "install_agenda_from_counter_bank"
  | "rez_counter_bank_for_handoff"
  | "rez_counter_bank_for_liquidation"
  | "liquidate_counter_bank"
  | "install_agenda"
  | "convert_agenda"
  | "advance_agenda"
  | "score_agenda";

export type CorpScoreFundingMilestone = Readonly<{
  kind: "score_credit_milestone";
  basis:
    | Readonly<{ kind: "score_route_gap" }>
    | Readonly<{
        kind: "score_protection_gap";
        needId: string;
        observedAtStateVersion: number;
      }>
    | Readonly<{ kind: "score_conversion_floor" }>
    | Readonly<{ kind: "score_continuation_floor" }>;
  targetCredits: number;
  observedCredits: number;
  remainingGap: number;
  priorityClass: CorpScorePriorityClass;
  hardness: "soft" | "hard";
  deadline: "current_turn" | "next_corp_turn" | "multi_turn";
  releaseCondition: "parent_invalidated_or_higher_priority_preemption";
}>;

export type CorpScoreProjectSignal = {
  /** Current route admission published by corp.score_agenda; evidence only explains it. */
  routeAssessment?:
    | "corp_opening_rush_engine_randomized"
    | "visible_legal_score_conversion"
    | "corp_funded_protected_score_advance"
    | "corp_last_viable_deckout_matchpoint_advance"
    | "corp_engine_certified_mature_remote_score_advance"
    | "corp_exposed_agenda_progress_preserves_conversion_clock"
    | "corp_deckout_agenda_flood_score_advance"
    | "corp_current_turn_scoreline_unreachable"
    | "corp_forced_agenda_discard_score_attempt"
    | "corp_recently_compromised_score_remote_requires_reprotection"
    | "corp_last_draw_hq_agenda_recycle_install"
    | "corp_deckout_agenda_flood_score_install"
    | "corp_access_punishing_agenda_deception_score_install"
    | "corp_score_protection_assessment_unknown"
    | "corp_last_click_score_install_deferred"
    | "corp_score_protection_funding_gap"
    | "corp_near_matchpoint_remote_maturity_required"
    | "corp_last_viable_deckout_matchpoint_install"
    | "corp_engine_certified_mature_remote_score_install"
    | "corp_bounded_staged_score_install"
    | "corp_score_protection_required"
    | "corp_score_horizon_unbounded"
    | "corp_funded_protected_score_install"
    | "corp_resident_score_parent_dominates_sibling_route";
  /** Positive certificate from the existing Engine-quoted same-turn conversion path. */
  sameTurnConversionProof?: "engine_quoted_path";
  projectId: string;
  agendaDefinitionId?: string;
  agendaPoints: number;
  agendaInstanceId?: string;
  serverId?: string;
  actionIds?: string[];
  routeSemanticActionTypes?: string[];
  phase: CorpScorePhase;
  sameTurnCloseout: boolean;
  deadlinePressure?: boolean;
  protectionNeed?: CorpFundedRemoteAccessRiskNeed;
  /**
   * Current-state score-horizon evidence derived by corp.score_agenda from
   * state-bound Engine rez and post-rez run quotes. A downstream defense
   * support search may preserve this certificate, but must not replace it
   * with a second protection verdict.
   */
  scoreHorizonCertification?: Readonly<{
    kind: "affordable_engine_quoted_defense_layers";
    observedAtStateVersion: number;
    serverId: string;
    layerInstanceIds: readonly [string, string];
    requiredCredits: number;
    requiredAgendaPoints: number;
  }>;
  uncertainty?: {
    kind: "later_score_route";
    knowledge: "unknown";
    reason: string;
    currentActionScope: "exact_install_only";
  };
  fundingGap?: number;
  sameTurnFundingActionIds?: string[];
  /**
   * Published by corp.score_agenda for its exact current credit objective.
   * Support leaves may advance it and lower-priority siblings may preserve it,
   * but neither may derive a competing target or retain it after the parent is
   * invalidated.
   */
  fundingMilestone?: CorpScoreFundingMilestone;
  conversion?: {
    remainingAdvancementClicks: number;
    remainingScoreCredits: number;
    existingRemoteIceCount: number;
    existingRemoteRezzedIceCount: number;
    residentParent: boolean;
    runnerStealPoints: number;
    runnerStealIsMatchpoint: boolean;
    realizedStrategySupportCount: number;
  };
  /** Exact route selected by corp.score_agenda for an advancement choice. */
  advancementCounterChoiceBinding?:
    | {
        kind: "move_advancement";
        sourceCardId: string;
        targetCardId: string;
        amount: number;
      }
    | {
        kind: "place_advancement";
        placements: Array<{ targetCardId: string; amount: number }>;
      };
  /**
   * Published only by corp.score_agenda from an Engine continuation quote.
   * corp.defend_servers may preserve this request but must never reconstruct it.
   */
  continuationReserve?: {
    agendaCardId: string;
    serverId: string;
    requiredCreditsBeforeNextCorpTurn: number;
    remainingAdvancementCounters: number;
    nextCorpTurnGuaranteedFlexibleClicks: number;
    certifiedCreditGainFromFreeClicks: number;
  };
  openingRush?: CorpOpeningRushDecision;
  setupNeed?: {
    needId: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
  };
  /**
   * Narrow, Engine-certified preparation state for an advanceable Corp asset
   * that can later move its own advancement counters to an agenda. This is a
   * score-plan concern, never a generic hand-development or economy route.
   */
  counterBank?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    serverId: string;
    advancementCounters: number;
    counterTarget: number;
    quoteStateVersion: number;
  };
  terminalScore: boolean;
  preventsTerminalSteal?: boolean;
  /** Exact installation horizon closes a winning score before unavoidable deckout. */
  lastDrawScoreSurvival?: boolean;
  feasible: boolean;
  evidenceCode: string;
};

export type CorpScorePriorityClass = "P1" | "P2" | "P3" | "P4";
