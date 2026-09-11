import {
  CorpScoreFundingMilestone,
  CorpScorePriorityClass,
} from "../../plans/corp-score-contracts";
import { type FundingRouteSearchResult } from "../../plans/funding-route";
import type { PriorityClass } from "../../plans/plan-assessment";
import { type CorpRestrictedRezPreparation } from "../../runtime/corp-restricted-credit-reserve";

export type CorpEconomySignalBase = {
  needId: string;
  urgentForScore: boolean;
  evidenceCode: string;
};

export type CorpEconomyFundingRouteAssessment = {
  routeId: string;
  status: FundingRouteSearchResult["bestRoute"]["status"];
  reliability: FundingRouteSearchResult["bestRoute"]["reliability"];
  headActionId?: string;
  evidence: string[];
};

export type CorpEconomyParentFundingSignal = CorpEconomySignalBase & {
  kind: "parent_funding";
  gap: number;
  actionIds: string[];
  delegatedPriorityClass?: CorpScorePriorityClass;
  parentPriorityClass?: PriorityClass;
  immediateDefenseConversion?: boolean;
  parentPlanInstanceId?: string;
  parentNeedId?: string;
  scoreFundingMilestone?: CorpScoreFundingMilestone;
  incrementalDefenseReserve?: {
    targetCredits: number;
    serverId: string;
    iceInstanceId: string;
  };
  fundingRouteAssessment?: CorpEconomyFundingRouteAssessment;
  restrictedCreditFunding?: import("@netgrid/shared").CorpRestrictedCreditRouteQuote[];
  restrictedCreditPreparations?: CorpRestrictedRezPreparation[];
};

export type CorpEconomyReserveSignal = CorpEconomySignalBase & {
  kind: "reserve";
  targetCredits: number;
  gap: number;
  actionIds: string[];
  priorityClass?: "P1" | "P5" | "P6";
  mandatoryCreditObligation?: { creditsDue: number; stateVersion: number };
  fundingRouteAssessment?: CorpEconomyFundingRouteAssessment;
};

export type CorpEconomyLiquidityDevelopmentSignal = CorpEconomySignalBase & {
  kind: "develop_liquidity";
  turnKey: string;
  targetCredits: number;
  currentCreditsAtRevalidation: number;
  gap: number;
  projectedCreditGain: 1;
  actionIds: [string];
  priorityClass: "P6";
  cadence: {
    kind: "remaining_turn_capacity";
    maximumConversions: number;
  };
  completion: {
    kind: "target_credits_or_no_clicks" | "remaining_turn_capacity_only";
  };
  revalidation: {
    stateVersion: number;
    status: "turn_liquidity_open";
  };
  residualCapacityOnly?: true;
};

export type CorpEconomyDevelopmentSignal = CorpEconomySignalBase & {
  kind: "develop_campaign";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  phase: "install" | "advance" | "rez";
  actionIds: string[];
  restrictedCreditNeed?: {
    needId: string;
    gap: number;
    quotes: import("@netgrid/shared").CorpRestrictedCreditRouteQuote[];
  };
  startRezChoiceBinding?: {
    actionId: string;
    choiceId: string;
    selectedOptionId: string;
    observedAtStateVersion: number;
  };
  cadence: {
    kind:
      | "finite_pool"
      | "automatic_start_of_turn"
      | "immediate_on_rez"
      | "counter_cashout_development";
    maximumSetupExecutions: 1;
  };
  payback: {
    projectedCredits: number;
    setupCreditCost: number;
    projectedNetCredits: number;
    horizonTurns: number;
    unadjustedProjectedCredits?: number;
    projectedOpportunityCostCredits?: number;
  };
  riskAdjustment?: {
    serverId: string;
    protectionState:
      | "unprotected"
      | "protected_contestable"
      | "protected_not_contestable"
      | "protection_unknown";
    baselineHorizonTurns: number;
    riskAdjustedHorizonTurns: number;
    projectedPayoutExecutions: number;
    evidenceCodes: string[];
  };
  completion: {
    kind: "source_phase_reached";
    expectedState:
      | "installed_unrezzed"
      | "advancement_counter_added"
      | "installed_rezzed";
  };
  counterCashout?: {
    currentAdvancementCounters: number;
    targetAdvancementCounters: number;
    creditsPerCounter: number;
    projectedCashoutCredits: number;
  };
};

export type CorpEconomyImmediateOperationSignal = CorpEconomySignalBase & {
  kind: "convert_immediate_operation";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  actionIds: [string];
  conversion: {
    clickCost: number;
    creditCost: number;
    grossLiquidCreditGain: number;
    netLiquidCreditGain: number;
    cardsDrawn: number;
    cardsConsumed: 1;
    netHandDelta: number;
    payoutMode: "fixed";
    reliability: "guaranteed";
    source: "legal_action_payload";
  };
  cadence: {
    kind: "single_action";
    maximumConversions: 1;
  };
  completion: {
    kind: "source_consumed";
  };
};

export type CorpEconomyVisibleCardWithdrawalSignal = CorpEconomySignalBase & {
  kind: "convert_visible_card_payout";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  sourceZone: "installed_root" | "score_area";
  actionIds: [string];
  withdrawalCampaign?: {
    remainingPoolCredits: number;
    projectedPayoutExecutions: number;
    projectedNetCredits: number;
    horizonTurns: number;
    evidenceCodes: string[];
  };
  conversion: {
    clickCost: number;
    creditCost: number;
    grossLiquidCreditGain: number;
    netLiquidCreditGain: number;
    cardsDrawn: 0;
    cardsConsumed: 0;
    netHandDelta: 0;
    payoutMode: "fixed";
    reliability: "guaranteed";
    source: "legal_action_payload";
    payoutSource: "hosted_credit_pool" | "advancement_counter_cashout";
    hostedCreditTakeMode?: "up_to_amount_if_available" | "all";
  };
  cadence: {
    kind: "single_action_revalidate";
    maximumConversions: 1;
  };
  completion: {
    kind: "source_pool_revalidated";
  };
};

export type CorpEconomyOperationThresholdSignal = CorpEconomySignalBase & {
  kind: "prepare_immediate_operation";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  actionIds: [string];
  threshold: {
    currentCredits: number;
    operationCreditCost: number;
    creditsAfterFunding: number;
    fundingGap: 1;
  };
  futureConversion: {
    strategicEconomyValue: number;
    classification: "reviewed_pure_burst_economy_operation";
    evidenceSource: "reviewed_strategic_hint";
  };
  cadence: {
    kind: "single_threshold_credit";
    maximumConversions: 1;
  };
  completion: {
    kind: "operation_becomes_legal";
  };
};

export type CorpEconomyStartRezChoiceSignal = CorpEconomySignalBase & {
  kind: "resolve_start_rez_choice";
  actionIds: [string];
  choiceId: string;
  selectedOptionId: "pass";
  observedAtStateVersion: number;
  optionIds: string[];
};

export type CorpEconomyOptionalActionCapacitySignal = CorpEconomySignalBase & {
  kind: "resolve_optional_action_capacity_offer";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  actionIds: [string];
  decision: "accept" | "decline";
  rejectedActionId: string;
  restriction:
    | "unrestricted"
    | "install_only"
    | "program_install_only"
    | "run_only";
  allowedActionTypes: string[];
  followupActionCapacity: 1;
  observedAtStateVersion: number;
  completion: {
    kind: "offer_consumed";
  };
};

export type CorpEconomyNeedSignal =
  | CorpEconomyParentFundingSignal
  | CorpEconomyReserveSignal
  | CorpEconomyLiquidityDevelopmentSignal
  | CorpEconomyDevelopmentSignal
  | CorpEconomyImmediateOperationSignal
  | CorpEconomyVisibleCardWithdrawalSignal
  | CorpEconomyOperationThresholdSignal
  | CorpEconomyStartRezChoiceSignal
  | CorpEconomyOptionalActionCapacitySignal;

export type EconomyState = { kind: "economy"; signal: CorpEconomyNeedSignal };
